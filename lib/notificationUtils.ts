'use client'

import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from './firebaseConfig'

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface CreateNotificationParams {
  type: 'task' | 'discussion' | 'calendar' | 'meeting' | 'application'
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'mentioned' | 'status_changed' | 'replied' | 'submitted'
  title: string
  message: string
  relatedEntityId: string
  targetUrl?: string
  createdBy: string
  createdByName: string
  createdByRole?: string
  recipientRoles?: string[] // Optional: Filter recipients by role (e.g., ['admin'] for management only)
  specificRecipients?: string[] // Optional: Send only to specific employee IDs
}

// ============================================
// SEND PUSH NOTIFICATIONS VIA API
// ============================================

/**
 * Fetches push subscriptions for the given recipient IDs from Firestore
 * and sends push notifications via the /api/push/send endpoint.
 */
async function sendPushToRecipients(
  recipientIds: string[],
  payload: { title: string; message: string; targetUrl?: string; type?: string }
): Promise<void> {
  try {
    if (recipientIds.length === 0) return

    // /api/push/send is staff-only: it verifies this ID token server-side and
    // looks the subscriptions up itself with the Admin SDK.
    const idToken = await auth?.currentUser?.getIdToken()
    if (!idToken) return

    await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        recipientIds,
        payload: {
          title: payload.title,
          body: payload.message,
          url: payload.targetUrl?.startsWith('/') ? payload.targetUrl : '/employee-portal',
          type: payload.type,
          tag: `${payload.type || 'notification'}-${Date.now()}`,
        },
      }),
    })
  } catch (error) {
    // Push failure must never block the notification itself.
    console.error('[Push] Error sending push notifications:', error)
  }
}

// ============================================
// CREATE PER-USER NOTIFICATIONS
// ============================================

/**
 * Creates a notification for EACH employee EXCEPT the one who triggered it.
 * Each employee gets their own notification document they can individually manage.
 * Stored in 'userNotifications' collection with a 'recipientId' field.
 * Also sends Web Push notifications to all recipients' devices.
 */
export async function createGlobalNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    console.log('🔔 Creating per-user notifications:', params)
    console.log('🔔 Creator ID:', params.createdBy)
    console.log('🔔 Related Entity ID:', params.relatedEntityId)
    
    // Get all employees
    const employeesRef = collection(db, 'Employees')
    const employeesSnapshot = await getDocs(employeesRef)
    
    console.log('🔔 Found', employeesSnapshot.docs.length, 'employees')
    
    if (employeesSnapshot.empty) {
      console.log('⚠️ No employees found')
      return false
    }

    // Sanitize title: strip any mojibake / corrupted emoji prefixes before storing
    const sanitizedTitle = params.title
      .replace(/^[\u0080-\u00ff\u00c0-\u00ff\u2018-\u201f\u2039\u203a]+\s*/g, '')
      .trim() || params.title.trim()
    const sanitizedParams = { ...params, title: sanitizedTitle }

    const notificationsRef = collection(db, 'userNotifications')
    const addPromises: Promise<any>[] = []
    const recipientIds: string[] = []
    
    employeesSnapshot.docs.forEach((empDoc) => {
      const empData = empDoc.data()
      const recipientId = empData.employeeId
      const recipientRole = empData.role

      // Skip corrupt/incomplete employee records
      if (!recipientId || !empData.name) return
      
      console.log('🔔 Checking employee:', empData.name, 'ID:', recipientId, 'Role:', recipientRole, 'vs Creator:', params.createdBy)
      
      // Skip the creator - they shouldn't get their own notification
      if (recipientId === params.createdBy) {
        console.log('⏭️ Skipping notification for creator:', recipientId)
        return
      }

      // If specific recipients are provided, only send to those
      if (params.specificRecipients && params.specificRecipients.length > 0) {
        if (!params.specificRecipients.includes(recipientId)) {
          console.log('⏭️ Skipping notification - not in specific recipients list:', empData.name)
          return
        }
      }
      // Otherwise, filter by role if recipientRoles is specified
      else if (params.recipientRoles && params.recipientRoles.length > 0) {
        if (!params.recipientRoles.includes(recipientRole)) {
          console.log('⏭️ Skipping notification - role filter:', empData.name, '(', recipientRole, ') not in', params.recipientRoles)
          return
        }
      }

      console.log('✅ Creating notification for:', empData.name, recipientId)
      recipientIds.push(recipientId)
      addPromises.push(
        addDoc(notificationsRef, {
          ...sanitizedParams,
          recipientId: recipientId,
          read: false,
          createdAt: Timestamp.now()
        })
      )
    })

    await Promise.all(addPromises)
    console.log(`✅ Created ${addPromises.length} notifications for all employees (except creator)`)

    // Send Web Push notifications to all recipients
    await sendPushToRecipients(recipientIds, {
      title: sanitizedTitle,
      message: params.message,
      targetUrl: params.targetUrl,
      type: params.type
    })

    return true
  } catch (error) {
    console.error('❌ Error creating per-user notifications:', error)
    return false
  }
}

// ============================================
// NOTIFY ALL ADMINS ABOUT NEW JOB APPLICATION
// ============================================

/**
 * Creates notifications for ALL admin employees when a new job application is received.
 * This can be called from public forms (no auth required) because
 * Firestore rules allow public create for type === 'application'.
 * Employees collection is also publicly readable.
 */
export async function notifyAdminsOfNewApplication(params: {
  /** Id of the `applications` doc just created; the server alert is keyed on it. */
  applicationId: string
  applicantName: string
  roleTitle: string
  roleId?: string | null
  isGeneralApplication?: boolean
}): Promise<boolean> {
  try {
    console.log('📋 Notifying admins of new application:', params)

    // Query all admin employees (Employees collection is publicly readable)
    const employeesRef = collection(db, 'Employees')
    const adminQuery = query(employeesRef, where('role', '==', 'admin'))
    const adminSnapshot = await getDocs(adminQuery)

    if (adminSnapshot.empty) {
      console.log('⚠️ No admin employees found to notify')
      return false
    }

    const notificationsRef = collection(db, 'userNotifications')
    const addPromises: Promise<any>[] = []

    const title = params.isGeneralApplication
      ? 'New General Application'
      : `New Application: ${params.roleTitle}`
    const message = params.isGeneralApplication
      ? `${params.applicantName} submitted a general interest application for "${params.roleTitle}"`
      : `${params.applicantName} applied for the ${params.roleTitle} position`

    adminSnapshot.docs.forEach((empDoc) => {
      const empData = empDoc.data()
      const recipientId = empData.employeeId

      console.log('✅ Creating application notification for admin:', empData.name, recipientId)

      addPromises.push(
        addDoc(notificationsRef, {
          type: 'application',
          action: 'submitted',
          title,
          message,
          relatedEntityId: params.roleId || '',
          targetUrl: '#job-postings',
          createdBy: 'public',
          createdByName: params.applicantName,
          recipientId,
          read: false,
          createdAt: Timestamp.now()
        })
      )
    })

    await Promise.all(addPromises)
    console.log(`✅ Created ${addPromises.length} application notifications for all admins`)

    // Applicants aren't signed in, so the push goes through a constrained
    // server route that reads the application itself and alerts admins once.
    fetch('/api/push/application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: params.applicationId }),
    }).catch(() => {})

    return true
  } catch (error) {
    console.error('❌ Error notifying admins of new application:', error)
    return false
  }
}

// Legacy alias for backward compatibility
export const createNotification = createGlobalNotification
