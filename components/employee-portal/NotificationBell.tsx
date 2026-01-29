'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { 
  FaBell, 
  FaTasks, 
  FaComments, 
  FaCalendarAlt, 
  FaCheckDouble,
  FaTrash
} from 'react-icons/fa'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  deleteDoc,
  Timestamp,
  where
} from 'firebase/firestore'
import { db } from '@/lib/firebaseConfig'
import { useEmployeeAuth } from '@/lib/employeePortalContext'
import { formatDistanceToNow } from 'date-fns'

// Notification type
interface Notification {
  id: string
  type: 'task' | 'discussion' | 'calendar'
  action?: string
  title: string
  message: string
  createdByName?: string
  read: boolean
  createdAt: Timestamp
}

interface NotificationBellProps {
  onNavigate?: (tab: string) => void
}

export default function NotificationBell({ onNavigate }: NotificationBellProps) {
  const { employee } = useEmployeeAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications for current user from Firestore
  useEffect(() => {
    if (!employee?.employeeId) {
      console.log('🔔 NotificationBell: No employee, clearing notifications')
      setNotifications([])
      setLoading(false)
      return
    }

    console.log('🔔 NotificationBell: Setting up Firestore listener for user:', employee.employeeId)
    
    const notificationsRef = collection(db, 'userNotifications')
    const q = query(
      notificationsRef,
      where('recipientId', '==', employee.employeeId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📬 NotificationBell: Received', snapshot.docs.length, 'notifications for user')
        const data = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Notification[]
        
        setNotifications(data)
        setLoading(false)
        console.log('📬 NotificationBell: Notifications set:', data)
      },
      (error) => {
        console.error('❌ NotificationBell: Error fetching notifications:', error)
        setLoading(false)
      }
    )

    return () => {
      console.log('🔔 NotificationBell: Cleaning up listener')
      unsubscribe()
    }
  }, [employee?.employeeId])

  // Ensure we're on client side for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'userNotifications', notificationId), { read: true })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db)
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'userNotifications', n.id), { read: true })
      })
      await batch.commit()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Clear all notifications (delete from Firestore)
  const clearAllNotifications = async () => {
    if (notifications.length === 0) return
    
    setClearing(true)
    try {
      // Delete notifications in batches (Firestore limit is 500 per batch)
      const batch = writeBatch(db)
      notifications.forEach(n => {
        batch.delete(doc(db, 'userNotifications', n.id))
      })
      await batch.commit()
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    } finally {
      setClearing(false)
    }
  }

  // Calculate position relative to button
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [])

  // Handle button click
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(prev => !prev)
  }

  // Close on ESC and outside click
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      clearTimeout(timer)
    }
  }, [isOpen])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    if (onNavigate) {
      switch (notification.type) {
        case 'task': onNavigate('tasks'); break
        case 'discussion': onNavigate('discussions'); break
        case 'calendar': onNavigate('calendar'); break
      }
    }
    
    setIsOpen(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <FaTasks className="text-blue-400" />
      case 'discussion': return <FaComments className="text-green-400" />
      case 'calendar': return <FaCalendarAlt className="text-purple-400" />
      default: return <FaBell className="text-neutral-400" />
    }
  }

  const getActionBadge = (action?: string) => {
    if (!action) return null
    const colors: Record<string, string> = {
      created: 'bg-green-500/20 text-green-400',
      updated: 'bg-blue-500/20 text-blue-400',
      deleted: 'bg-red-500/20 text-red-400',
      assigned: 'bg-purple-500/20 text-purple-400',
      mentioned: 'bg-amber-500/20 text-amber-400',
      status_changed: 'bg-cyan-500/20 text-cyan-400',
      replied: 'bg-indigo-500/20 text-indigo-400'
    }
    const labels: Record<string, string> = {
      created: 'New',
      updated: 'Updated',
      deleted: 'Deleted',
      assigned: 'Assigned',
      mentioned: 'Mention',
      status_changed: 'Status',
      replied: 'Reply'
    }
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors[action] || 'bg-neutral-500/20 text-neutral-400'}`}>
        {labels[action] || action}
      </span>
    )
  }

  const formatTime = (timestamp: Timestamp) => {
    try {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true })
    } catch {
      return 'Just now'
    }
  }

  return (
    <>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        type="button"
        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group cursor-pointer"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <FaBell className="text-lg text-neutral-400 group-hover:text-white transition-colors" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown via Portal */}
      {mounted && isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{ 
            position: 'fixed',
            top: position.top,
            right: position.right,
            zIndex: 999999
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="w-96 max-w-[calc(100vw-2rem)] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-neutral-800/50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FaBell className="text-primary-400" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                  >
                    <FaCheckDouble size={12} />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-neutral-500">
                  <div className="animate-spin w-6 h-6 border-2 border-neutral-600 border-t-primary-400 rounded-full mx-auto mb-2"></div>
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-neutral-500">
                  <FaBell className="text-3xl mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium truncate ${!notification.read ? 'text-white' : 'text-neutral-300'}`}>
                            {notification.title}
                          </p>
                          {getActionBadge(notification.action)}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-neutral-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          {notification.createdByName && (
                            <span className="text-[10px] text-neutral-500">
                              by {notification.createdByName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Clear All */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-white/10 bg-neutral-800/30 rounded-b-2xl">
                {showClearConfirm ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Clear all notifications?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        disabled={clearing}
                        className="text-xs px-2.5 py-1 rounded-lg bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        disabled={clearing}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1"
                      >
                        {clearing ? (
                          <>
                            <span className="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full"></span>
                            Clearing...
                          </>
                        ) : (
                          'Confirm'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 py-1 transition-colors"
                  >
                    <FaTrash size={10} />
                    Clear all notifications
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>,
        document.body
      )}
    </>
  )
}
