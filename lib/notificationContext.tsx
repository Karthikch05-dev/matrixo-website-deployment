'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  limit,
  writeBatch,
  Timestamp,
  where,
  deleteDoc
} from 'firebase/firestore'
import { db } from './firebaseConfig'
import { useEmployeeAuth } from './employeePortalContext'
import { requestNotificationPermission, sendBrowserNotification } from './pushNotifications'
import { registerServiceWorker } from './serviceWorkerRegistration'

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
  recipientId: string // Employee ID who should see this notification
  read: boolean
  createdAt: Timestamp
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
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
  // REALTIME NOTIFICATION LISTENER (PER-USER)
  // ============================================
  
  useEffect(() => {
    console.log('🔔 NotificationProvider effect running. User:', !!user, 'Employee:', !!employee)
    
    if (!user || !employee) {
      console.log('🔔 No user/employee, clearing notifications')
      setNotifications([])
      return
    }

    console.log('🔔 Setting up Firestore listener for userNotifications, recipientId:', employee.employeeId)
    
    // Subscribe to notifications for THIS USER ONLY
    const notificationsRef = collection(db, 'userNotifications')
    const q = query(
      notificationsRef,
      where('recipientId', '==', employee.employeeId),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📬 User notifications snapshot received:', snapshot.docs.length, 'docs')
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[]
        
        console.log('📬 User notifications:', notificationsData.length)
        setNotifications(notificationsData)

        // Show browser push notification for new notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = { id: change.doc.id, ...change.doc.data() } as Notification
            
            // Show push for new unread notifications
            if (!notification.read && permissionState === 'granted') {
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
      (error) => {
        console.error('❌ Error fetching user notifications:', error)
        console.error('❌ Error message:', error.message)
        console.error('❌ Error code:', (error as any).code)
      }
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
      await updateDoc(doc(db, 'userNotifications', notificationId), {
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
          batch.update(doc(db, 'userNotifications', notification.id), { read: true })
        }
      })

      await batch.commit()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [employee, notifications])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Hard delete the notification document
      await deleteDoc(doc(db, 'userNotifications', notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [])

  const clearAllNotifications = useCallback(async () => {
    if (!employee) return

    try {
      const batch = writeBatch(db)

      notifications.forEach(notification => {
        if (notification.id) {
          batch.delete(doc(db, 'userNotifications', notification.id))
        }
      })

      await batch.commit()
      console.log('✅ Cleared all notifications for user:', employee.employeeId)
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }, [employee, notifications])

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
        clearAllNotifications,
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

// Re-export notification creation utilities for backwards compatibility
export { createGlobalNotification, createNotification, type CreateNotificationParams } from './notificationUtils'
