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
  title: string
  message: string
  targetId: string // ID of task/discussion/calendar event
  targetUrl?: string // Deep link to the item
  recipientId: string // Employee ID who should receive this
  senderId: string // Employee ID who triggered it
  senderName: string
  read: boolean
  createdAt: Timestamp
  icon?: string
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
  // REALTIME NOTIFICATION LISTENER
  // ============================================
  
  useEffect(() => {
    if (!user || !employee) {
      setNotifications([])
      return
    }

    // Subscribe to notifications for this user
    const notificationsRef = collection(db, 'notifications')
    const q = query(
      notificationsRef,
      where('recipientId', '==', employee.employeeId),
      // Note: orderBy removed to avoid requiring composite index
      // Sorting is done client-side
      limit(50)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[]
        
        // Sort by createdAt descending (newest first)
        notificationsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })
        
        setNotifications(notificationsData)

        // Show browser push notification for new unread notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = { id: change.doc.id, ...change.doc.data() } as Notification
            
            // Only show push for new notifications (not on initial load)
            if (!notification.read && permissionState === 'granted') {
              sendBrowserNotification(
                notification.title,
                notification.message,
                notification.icon,
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
// HELPER: CREATE NOTIFICATION (Used in employeePortalContext)
// ============================================

/**
 * Creates a notification in Firestore
 * Called from employeePortalContext when tasks/discussions/events are created
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  try {
    // Don't notify if sender is the same as recipient (self-notification)
    if (notification.senderId === notification.recipientId) {
      return
    }

    await addDoc(collection(db, 'notifications'), {
      ...notification,
      read: false,
      createdAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

// ============================================
// HELPER: BROADCAST TO ALL USERS (GLOBAL)
// ============================================

/**
 * Broadcasts a notification to ALL active users
 * Used for global announcements: tasks, discussions, holidays, etc.
 * @param allEmployees Array of all employee profiles
 * @param notification Base notification data (without recipientId)
 */
export async function notifyAllUsers(
  allEmployees: any[],
  notificationData: Omit<Notification, 'id' | 'createdAt' | 'read' | 'recipientId'>
) {
  try {
    const batch = writeBatch(db)
    const notificationsRef = collection(db, 'notifications')
    
    // Create notification for each employee
    for (const emp of allEmployees) {
      // Skip sender (no self-notification)
      if (emp.employeeId === notificationData.senderId) {
        continue
      }
      
      const docRef = doc(notificationsRef)
      batch.set(docRef, {
        ...notificationData,
        recipientId: emp.employeeId,
        read: false,
        createdAt: Timestamp.now()
      })
    }
    
    await batch.commit()
  } catch (error) {
    console.error('Error broadcasting notifications to all users:', error)
  }
}
