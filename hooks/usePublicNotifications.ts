'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import type { PublicNotification } from '@/lib/publicNotifications'

const LOCAL_STORAGE_KEY = 'matrixo_public_read_notifications'

export interface NotificationsPage {
  notifications: PublicNotification[]
  hasMore: boolean
}

interface Options {
  /** Server-rendered first page; skips the initial request entirely. */
  initial?: NotificationsPage | null
  /**
   * Wait for the page to go idle before the first request. Right for the nav
   * bell (never competes with page content); wrong for /notifications itself.
   */
  deferInitial?: boolean
}

export function usePublicNotifications({ initial = null, deferInitial = true }: Options = {}) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<PublicNotification[]>(initial?.notifications ?? [])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(!initial)
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? false)
  const [error, setError] = useState<string | null>(null)

  // Helper to get local read IDs
  const getLocalReadIds = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const lastNotificationIdRef = useRef<string>(initial?.notifications[initial.notifications.length - 1]?.id ?? '')

  // Load notifications from API
  const fetchNotifications = useCallback(async (loadMore = false) => {
    try {
      setIsLoading(true)
      const afterId = loadMore ? lastNotificationIdRef.current : ''
      
      const res = await fetch(`/api/notifications?limit=20${afterId ? `&after=${afterId}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      
      const data = await res.json()
      
      if (data.notifications && data.notifications.length > 0) {
        lastNotificationIdRef.current = data.notifications[data.notifications.length - 1].id
      }

      if (loadMore) {
        setNotifications(prev => [...prev, ...data.notifications])
      } else {
        setNotifications(data.notifications)
      }
      
      setHasMore(data.hasMore)
      setError(null)
    } catch (err: any) {
      console.warn('[notifications]', err?.message || err)
      setError(err.message || 'Error fetching notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load read state
  const fetchReadState = useCallback(async () => {
    if (user) {
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/notifications/read-state', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setReadIds(new Set(data.readIds || []))
          return
        }
      } catch (err) {
        console.error('Failed to fetch read state', err)
      }
    }
    
    // Fallback or visitor
    setReadIds(new Set(getLocalReadIds()))
  }, [user])

  // First load waits until the page has painted and settled, so the badge
  // request never competes with the page's own content. Polling pauses while
  // the tab is hidden.
  useEffect(() => {
    let cancelled = false
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const start = () => !cancelled && fetchNotifications()
    let idle: number | undefined
    if (!initial) {
      if (!deferInitial) start()
      else idle = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 4000 }) : window.setTimeout(start, 2000)
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
      if (idle !== undefined && !w.requestIdleCallback) window.clearTimeout(idle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNotifications])

  // Load read state initially and on user change
  useEffect(() => {
    fetchReadState()
  }, [fetchReadState])

  // Mark as read
  const markAsRead = async (ids: string[]) => {
    if (!ids || ids.length === 0) return

    // Optimistic update
    setReadIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      
      // Update local storage for everyone as fallback/visitor state
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(next)))
      
      return next
    })

    if (user) {
      try {
        const token = await user.getIdToken()
        await fetch('/api/notifications/read-state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ notificationIds: ids })
        })
      } catch (err) {
        console.error('Failed to mark as read in API', err)
      }
    }
  }

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    markAsRead(allIds)
  }

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length
  
  // Client-side UI check (backend enforces actual security)
  const isEmployee = Boolean(
    user?.email && 
    (user.email.endsWith('@matrixo.in') || user.email.endsWith('.matrixo@gmail.com'))
  )

  const deleteNotification = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id))
    
    if (user) {
      try {
        const token = await user.getIdToken()
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!res.ok) {
          // Revert optimistic update on failure by refetching
          fetchNotifications()
          throw new Error('Failed to delete notification')
        }
      } catch (err) {
        console.error('Failed to delete notification', err)
      }
    }
  }

  return {
    notifications,
    readIds,
    isLoading,
    hasMore,
    error,
    unreadCount,
    isEmployee,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
