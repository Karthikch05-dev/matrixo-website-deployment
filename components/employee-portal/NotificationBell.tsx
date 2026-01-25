'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaBell, 
  FaTasks, 
  FaComments, 
  FaCalendarAlt, 
  FaCheck,
  FaCheckDouble,
  FaTimes
} from 'react-icons/fa'
import { useNotifications } from '@/lib/notificationContext'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// NOTIFICATION BELL COMPONENT
// ============================================

export default function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    requestPermission,
    permissionState
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Request permission on first interaction
  const handleBellClick = async () => {
    setIsOpen(!isOpen)
    
    if (permissionState === 'default') {
      await requestPermission()
    }
  }

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.read && notification.id) {
      await markAsRead(notification.id)
    }

    // Navigate to target (if URL exists)
    if (notification.targetUrl) {
      window.location.hash = notification.targetUrl
    }

    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FaTasks className="text-blue-400" />
      case 'discussion':
        return <FaComments className="text-green-400" />
      case 'calendar':
        return <FaCalendarAlt className="text-purple-400" />
      default:
        return <FaBell className="text-neutral-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group"
        aria-label="Notifications"
      >
        <FaBell className="text-lg text-neutral-400 group-hover:text-white transition-colors" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed right-4 top-16 w-96 max-w-[calc(100vw-2rem)] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl"
              style={{ zIndex: 99999 }}
            >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-neutral-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FaBell className="text-primary-400" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                  >
                    <FaCheckDouble className="text-xs" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <FaBell className="text-5xl text-neutral-700 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`
                        px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer relative
                        ${!notification.read ? 'bg-primary-500/5' : ''}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
                      )}

                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-neutral-300'}`}>
                              {notification.title}
                            </h4>
                            
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (notification.id) markAsRead(notification.id)
                                }}
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                                aria-label="Mark as read"
                              >
                                <FaCheck className="text-xs" />
                              </button>
                            )}
                          </div>
                          
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-neutral-500">
                              {notification.createdAt && formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                            </span>
                            
                            {notification.senderName && (
                              <span className="text-xs text-neutral-500">
                                by {notification.senderName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Permission Request */}
            {permissionState === 'default' && (
              <div className="px-4 py-3 border-t border-white/10 bg-neutral-800/50">
                <button
                  onClick={async () => {
                    await requestPermission()
                  }}
                  className="w-full px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FaBell />
                  Enable Browser Notifications
                </button>
              </div>
            )}

            {permissionState === 'denied' && (
              <div className="px-4 py-3 border-t border-white/10 bg-amber-500/10">
                <p className="text-xs text-amber-400 text-center">
                  Browser notifications are blocked. Enable them in your browser settings.
                </p>
              </div>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
