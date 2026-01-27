'use client'

import { collection, addDoc, Timestamp } from 'firebase/firestore'
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
// CREATE GLOBAL NOTIFICATION
// ============================================

/**
 * Creates a GLOBAL notification visible to ALL users
 * This is a single document in Firestore, not per-user
 */
export async function createGlobalNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    console.log('🔔 Creating global notification:', params)
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...params,
      read: false,
      createdAt: Timestamp.now()
    })
    console.log('✅ Notification created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('❌ Error creating global notification:', error)
    return null
  }
}

// Legacy alias for backward compatibility
export const createNotification = createGlobalNotification
