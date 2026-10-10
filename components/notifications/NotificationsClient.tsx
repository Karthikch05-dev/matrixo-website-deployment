'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Bell, CheckCheck } from 'lucide-react'
import { usePublicNotifications, type NotificationsPage } from '@/hooks/usePublicNotifications'
import type { NotificationCategory, PublicNotification } from '@/lib/publicNotifications'
import { NotificationIcon, relativeTime } from '@/components/site/NotificationCenter'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/Controls'
import { Skeleton } from '@/components/ui/Feedback'
import { cn } from '@/lib/cn'

type Tab = 'ALL' | NotificationCategory

export default function NotificationsClient({ initial }: { initial: NotificationsPage | null }) {
  const router = useRouter()
  const { notifications, readIds, isLoading, hasMore, error, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    usePublicNotifications({ initial, deferInitial: false })
  const [tab, setTab] = useState<Tab>('ALL')

  const counts = useMemo(() => {
    const by = (c: string) => notifications.filter((n) => n.category === c).length
    return { ALL: notifications.length, EVENTS: by('EVENTS'), STUDENTVAULT: by('STUDENTVAULT'), PLATFORM: by('PLATFORM') }
  }, [notifications])

  const shown = notifications.filter((n) => tab === 'ALL' || n.category === tab)

  const open = (n: PublicNotification) => {
    if (!readIds.has(n.id)) markAsRead([n.id])
    if (n.targetUrl) router.push(n.targetUrl)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold tracking-[-0.035em] text-ink sm:text-[44px]">Notifications</h1>
          <p className="mt-1 text-[16px] text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : 'New events, hackathons and StudentVault offers.'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0} leadingIcon={<CheckCheck aria-hidden="true" className="h-4 w-4" />}>
          Mark all read
        </Button>
      </div>

      <SegmentedControl<Tab>
        label="Filter notifications"
        value={tab}
        onChange={setTab}
        className="mt-8"
        segments={[
          { value: 'ALL', label: 'All', count: counts.ALL },
          { value: 'EVENTS', label: 'Events', count: counts.EVENTS },
          { value: 'STUDENTVAULT', label: 'StudentVault', count: counts.STUDENTVAULT },
          { value: 'PLATFORM', label: 'Updates', count: counts.PLATFORM },
        ]}
      />

      <div className="mt-6 overflow-hidden rounded-card border border-line bg-surface">
        {isLoading && notifications.length === 0 ? (
          <ul aria-busy="true" aria-label="Loading notifications">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex gap-4 border-b border-line p-5 last:border-0">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3.5 w-5/6" />
                </div>
              </li>
            ))}
          </ul>
        ) : error && notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[17px] font-semibold text-ink">Couldn’t load notifications</p>
            <p className="mt-1 text-[15px] text-muted">Check your connection and try again.</p>
            <Button variant="secondary" className="mt-5" onClick={() => fetchNotifications()}>
              Try again
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas-subtle text-subtle">
              <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-[17px] font-semibold text-ink">Nothing here yet</p>
            <p className="mt-1 max-w-sm text-[15px] text-muted">We’ll let you know when there’s something new in this category.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((n) => {
              const unread = !readIds.has(n.id)
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={cn('group flex w-full gap-4 p-5 text-left transition-colors hover:bg-ink/[0.03] sm:p-6', unread && 'bg-accent-soft/40')}
                  >
                    <NotificationIcon notification={n} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={cn('text-[16px] leading-snug', unread ? 'font-semibold text-ink' : 'font-medium text-ink/80')}>{n.title}</span>
                        <span className="shrink-0 pt-0.5 text-[12px] tabular-nums text-subtle">{relativeTime(n.publishedAt)}</span>
                      </span>
                      <span className="mt-1 block text-[15px] leading-relaxed text-muted">{n.message}</span>
                      {n.targetUrl && (
                        <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-accent">
                          View details <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </span>
                    {unread && <span aria-label="Unread" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {hasMore && (
          <div className="border-t border-line p-4 text-center">
            <Button variant="ghost" onClick={() => fetchNotifications(true)} loading={isLoading}>
              Load older notifications
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
