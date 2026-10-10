import NotificationsClient from '@/components/notifications/NotificationsClient'
import { getCachedFirstPage } from '@/lib/publicNotifications'
import type { NotificationsPage } from '@/hooks/usePublicNotifications'

// The list is public; render the first page on the server so it arrives with
// the HTML instead of after a client round-trip.
export const revalidate = 60

export default async function NotificationsPageRoute() {
  let initial: NotificationsPage | null = null
  try {
    const page = await getCachedFirstPage(20, null)
    initial = {
      hasMore: page.hasMore,
      notifications: page.notifications.map((n) => ({ ...n })),
    }
  } catch (error) {
    // No Admin credentials (e.g. a preview build) — the client fetches instead.
    console.warn('[notifications] server render skipped:', error instanceof Error ? error.message : error)
  }
  return <NotificationsClient initial={initial} />
}
