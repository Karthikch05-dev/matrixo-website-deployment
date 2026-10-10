'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CalendarDays, CheckCheck, Gift, Megaphone, Trophy, X } from 'lucide-react'
import { usePublicNotifications } from '@/hooks/usePublicNotifications'
import type { PublicNotification } from '@/lib/publicNotifications'
import Sheet from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'

export function relativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function NotificationIcon({ notification, className }: { notification: PublicNotification; className?: string }) {
  const { category, type } = notification
  const Icon =
    category === 'STUDENTVAULT' ? Gift : type === 'NEW_HACKATHON' ? Trophy : category === 'EVENTS' ? CalendarDays : Megaphone
  const tone =
    category === 'STUDENTVAULT'
      ? 'bg-success/10 text-success'
      : category === 'EVENTS' || type === 'NEW_HACKATHON'
        ? 'bg-accent-soft text-accent'
        : 'bg-warning/10 text-warning'
  return (
    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone, className)}>
      <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </span>
  )
}

type ListProps = ReturnType<typeof usePublicNotifications> & { onNavigate: () => void; compact?: boolean }

function NotificationList({
  notifications,
  readIds,
  isLoading,
  error,
  markAsRead,
  isEmployee,
  deleteNotification,
  fetchNotifications,
  onNavigate,
  compact,
}: ListProps) {
  const router = useRouter()
  const items = notifications.slice(0, compact ? 6 : 20)

  if (error && notifications.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[15px] font-medium text-ink">Couldn’t load notifications</p>
        <p className="mt-1 text-[14px] text-muted">Check your connection and try again.</p>
        <button type="button" onClick={() => fetchNotifications()} className="mt-4 text-[14px] font-medium text-accent hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (isLoading && notifications.length === 0) {
    return (
      <ul className="space-y-1 p-2" aria-busy="true" aria-label="Loading notifications">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-3 rounded-2xl p-3">
            <span className="skeleton h-10 w-10 shrink-0 rounded-full" />
            <span className="flex-1 space-y-2 pt-1">
              <span className="skeleton block h-3.5 w-2/3" />
              <span className="skeleton block h-3 w-full" />
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canvas-subtle text-subtle">
          <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <p className="text-[15px] font-semibold text-ink">You’re all caught up</p>
        <p className="mt-1 max-w-[16rem] text-[14px] leading-relaxed text-muted">
          New events, hackathons and StudentVault offers will show up here.
        </p>
      </div>
    )
  }

  return (
    <ul className="p-2">
      {items.map((n) => {
        const unread = !readIds.has(n.id)
        return (
          <li key={n.id} className="group relative">
            <button
              type="button"
              onClick={() => {
                if (unread) markAsRead([n.id])
                onNavigate()
                if (n.targetUrl) router.push(n.targetUrl)
              }}
              className="flex w-full gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-ink/[0.04] focus-visible:bg-ink/[0.04]"
            >
              <NotificationIcon notification={n} />
              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-2">
                  <span className={cn('flex-1 text-[15px] leading-snug', unread ? 'font-semibold text-ink' : 'font-medium text-ink/80')}>
                    {n.title}
                  </span>
                  <span className="mt-0.5 shrink-0 text-[12px] tabular-nums text-subtle">{relativeTime(n.publishedAt)}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[14px] leading-relaxed text-muted">{n.message}</span>
              </span>
              {unread && <span aria-label="Unread" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </button>
            {isEmployee && (
              <button
                type="button"
                onClick={() => deleteNotification(n.id)}
                aria-label={`Remove “${n.title}”`}
                className="absolute right-3 top-3 hidden h-7 w-7 items-center justify-center rounded-full bg-surface text-subtle shadow-card hover:text-danger group-hover:flex focus-visible:flex"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The bell in the header. Desktop gets an anchored 400px popover; phones get
 * a full-height sheet with large tap targets.
 */
export default function NotificationCenter() {
  const state = usePublicNotifications()
  const { unreadCount, markAllAsRead, fetchNotifications } = state
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Popover: close on outside click and Escape.
  useEffect(() => {
    if (!open || mobile) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, mobile])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  const close = () => setOpen(false)
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'

  const markAll =
    unreadCount > 0 ? (
      <button
        type="button"
        onClick={markAllAsRead}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-accent transition-colors hover:bg-accent-soft"
      >
        <CheckCheck aria-hidden="true" className="h-4 w-4" />
        Mark all read
      </button>
    ) : null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-[background-color,transform] duration-200 hover:bg-ink/[0.06] active:scale-95"
      >
        <Bell aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-danger px-1 text-[10.5px] font-semibold tabular-nums text-white ring-2 ring-canvas"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {mobile ? (
        <Sheet
          open={open}
          onClose={close}
          title="Notifications"
          side="bottom"
          className="h-[88dvh]"
          headerActions={markAll}
          footer={
            <Link
              href="/notifications"
              onClick={close}
              className="flex h-12 w-full items-center justify-center rounded-full bg-ink/[0.06] text-[15px] font-medium text-ink"
            >
              See all notifications
            </Link>
          }
        >
          <NotificationList {...state} onNavigate={close} />
        </Sheet>
      ) : (
        open && (
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-[calc(100%+10px)] z-[1100] w-[400px] origin-top-right animate-scale-in overflow-hidden rounded-[22px] border border-line bg-elevated shadow-overlay"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Notifications</h2>
              {markAll}
            </div>
            <div className="max-h-[min(480px,calc(100vh-180px))] overflow-y-auto overscroll-contain">
              <NotificationList {...state} onNavigate={close} compact />
            </div>
            <div className="border-t border-line p-2">
              <Link
                href="/notifications"
                onClick={close}
                className="flex h-10 items-center justify-center rounded-xl text-[14px] font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                See all notifications
              </Link>
            </div>
          </div>
        )
      )}
    </div>
  )
}
