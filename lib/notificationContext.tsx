'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getDocs,
  limit,
  writeBatch
} from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { useEmployeeAuth } from './employeePortalContext'
import { requestNotificationPermission, sendBrowserNotification } from './pushNotifications'
import { registerServiceWorker } from './serviceWorkerRegistration'

const db = getFirestore()

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Notification {
  id?: string
  type: 'task' | 'discussion' | 'calendar'
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'mentioned' | 'status_changed' | 'replied'
  title: string
  message: string
  relatedEntityId: string // ID of task/discussion/calendar event
  targetUrl?: string // Deep link to the item
  createdBy: string // Employee ID who triggered it
  createdByName: string // Display name
  createdByRole?: string // Role/department
  read: boolean
  createdAt: Timestamp
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  requestPermission: () => Promise<NotificationPermission>
  permissionState: NotificationPermission
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// ============================================
// NOTIFICATION PROVIDER
// ============================================

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { employee, user } = useEmployeeAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

  // Check current notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission)
      
      // Register service worker for push notifications
      registerServiceWorker().catch(error => {
        console.error('Failed to register service worker:', error)
      })
    }
  }, [])

  // ============================================
  // REALTIME NOTIFICATION LISTENER (GLOBAL FEED)
  // ============================================
  
  useEffect(() => {
    if (!user || !employee) {
      setNotifications([])
      return
    }

    // Subscribe to ALL global notifications (no filtering by recipient)
    const notificationsRef = collection(db, 'notifications')
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[]
        
        setNotifications(notificationsData)

        // Show browser push notification for new notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = { id: change.doc.id, ...change.doc.data() } as Notification
            
            // Only show push for new notifications (not created by current user)
            if (!notification.read && permissionState === 'granted' && notification.createdBy !== employee.employeeId) {
              sendBrowserNotification(
                notification.title,
                notification.message,
                undefined,
                notification.targetUrl
              )
            }
          }
        })
      },
      (error) => console.error('Error fetching notifications:', error)
    )

    return () => unsubscribe()
  }, [user, employee, permissionState])

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const unreadCount = notifications.filter(n => !n.read).length

  // ============================================
  // ACTIONS
  // ============================================

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!employee) return

    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      const batch = writeBatch(db)

      unreadNotifications.forEach(notification => {
        if (notification.id) {
          batch.update(doc(db, 'notifications', notification.id), { read: true })
        }
      })

      await batch.commit()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [employee, notifications])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Soft delete by marking as read and filtering client-side
      // Or implement hard delete if preferred
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setPermissionState(permission)
    return permission
  }, [])

  // ============================================
  // PROVIDER VALUE
  // ============================================

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        requestPermission,
        permissionState
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// ============================================
// HELPER: CREATE GLOBAL NOTIFICATION
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

/**
 * Creates a GLOBAL notification visible to ALL users
 * This is a single document in Firestore, not per-user
 */
export async function createGlobalNotification(params: CreateNotificationParams) {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...params,
      read: false,
      createdAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error creating global notification:', error)
  }
}

// Legacy alias for backward compatibility
export const createNotification = createGlobalNotification
