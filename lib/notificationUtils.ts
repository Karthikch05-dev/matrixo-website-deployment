'use client'

import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebaseConfig'

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface CreateNotificationParams {
  type: 'task' | 'discussion' | 'calendar' | 'meeting'
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'mentioned' | 'status_changed' | 'replied'
  title: string
  message: string
  relatedEntityId: string
  targetUrl?: string
  createdBy: string
  createdByName: string
  createdByRole?: string
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

    // Fetch all push subscriptions for these recipients
    // Firestore 'in' query supports up to 30 items per query
    const allSubscriptions: any[] = []
    const batchSize = 30

    for (let i = 0; i < recipientIds.length; i += batchSize) {
      const batch = recipientIds.slice(i, i + batchSize)
      const subsRef = collection(db, 'pushSubscriptions')
      const q = query(subsRef, where('employeeId', 'in', batch))
      const snapshot = await getDocs(q)
      
      snapshot.docs.forEach(doc => {
        allSubscriptions.push(doc.data())
      })
    }

    if (allSubscriptions.length === 0) {
      console.log('[Push] No push subscriptions found for recipients')
      return
    }

    console.log(`[Push] Found ${allSubscriptions.length} push subscriptions, sending...`)

    // Call the push API endpoint
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptions: allSubscriptions,
        payload: {
          title: payload.title,
          body: payload.message,
          tag: `${payload.type || 'notification'}-${Date.now()}`,
          data: {
            url: payload.targetUrl || '/employee-portal',
            type: payload.type
          }
        }
      })
    })

    const result = await response.json()
    console.log('[Push] Send result:', result)

    // Clean up expired subscriptions if any
    if (result.expiredEmployees && result.expiredEmployees.length > 0) {
      console.log('[Push] Cleaning up expired subscriptions for:', result.expiredEmployees)
      // We could delete them here but it's not critical - they'll fail silently next time
    }

  } catch (error) {
    console.error('[Push] Error sending push notifications:', error)
    // Don't throw - push failure shouldn't block the notification creation
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

    const notificationsRef = collection(db, 'userNotifications')
    const addPromises: Promise<any>[] = []
    const recipientIds: string[] = []
    
    employeesSnapshot.docs.forEach((empDoc) => {
      const empData = empDoc.data()
      const recipientId = empData.employeeId
      
      console.log('🔔 Checking employee:', empData.name, 'ID:', recipientId, 'vs Creator:', params.createdBy)
      
      // Skip the creator - they shouldn't get their own notification
      if (recipientId === params.createdBy) {
        console.log('⏭️ Skipping notification for creator:', recipientId)
        return
      }

      console.log('✅ Creating notification for:', empData.name, recipientId)
      recipientIds.push(recipientId)
      addPromises.push(
        addDoc(notificationsRef, {
          ...params,
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
      title: params.title,
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

// Legacy alias for backward compatibility
export const createNotification = createGlobalNotification
