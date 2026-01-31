'use client'

import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore'
import { db } from './firebaseConfig'

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface CreateNotificationParams {
  type: 'task' | 'discussion' | 'calendar'
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
// CREATE PER-USER NOTIFICATIONS
// ============================================

/**
 * Creates a notification for EACH employee EXCEPT the one who triggered it.
 * Each employee gets their own notification document they can individually manage.
 * Stored in 'userNotifications' collection with a 'recipientId' field.
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
    return true
  } catch (error) {
    console.error('❌ Error creating per-user notifications:', error)
    return false
  }
}

// Legacy alias for backward compatibility
export const createNotification = createGlobalNotification
