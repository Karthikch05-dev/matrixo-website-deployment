import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee } from '@/lib/studentvault/auth'
import {
  createPublicNotification,
  mapEventCategoryToNotificationType,
} from '@/lib/publicNotifications'
import eventsData from '@/data/events.json'

export const dynamic = 'force-dynamic'

interface EventData {
  id: string
  slug: string
  title: string
  tagline?: string
  description?: string
  category: string
  date?: string
  [key: string]: unknown
}

/**
 * POST — Announce a static-JSON event as a public notification.
 *
 * Employee-only. Because events live in `data/events.json` (not Firestore),
 * there is no "publish event" hook to automate this. Admins call this endpoint
 * when they want to notify visitors about a new or newly-visible event.
 *
 * Body: { eventSlug: string }
 *
 * Duplicate-safe: calling this twice for the same slug is a no-op.
 */
export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const eventSlug = typeof body?.eventSlug === 'string' ? body.eventSlug.trim() : ''

    if (!eventSlug) {
      return NextResponse.json(
        { error: 'eventSlug is required.' },
        { status: 400 }
      )
    }

    // ── Look up the event ──────────────────────────────────────────────
    const events = eventsData as EventData[]
    const event = events.find(
      (e) => e.slug === eventSlug || e.id === eventSlug
    )

    if (!event) {
      return NextResponse.json(
        { error: `No event found with slug or id "${eventSlug}".` },
        { status: 404 }
      )
    }

    // ── Generate a deterministic hash for the event's meaningful details ──
    const hashData = `${event.title}|${event.description || ''}|${event.tagline || ''}|${event.date || ''}|${event.venue || ''}|${event.status || ''}|${event.category || ''}`
    const crypto = await import('crypto')
    const versionHash = crypto.createHash('sha256').update(hashData).digest('hex')
    const sourceId = event.id || event.slug

    // ── Check if any notification exists to decide NEW vs UPDATED ────────
    const { getAdminFirestore } = await import('@/lib/firebaseAdmin')
    const { PUBLIC_NOTIFICATIONS_COLLECTION } = await import('@/lib/publicNotifications')
    
    const existing = await getAdminFirestore()
      .collection(PUBLIC_NOTIFICATIONS_COLLECTION)
      .where('source', '==', 'EVENTS')
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get()

    const isUpdate = !existing.empty
    const notificationType = isUpdate ? 'EVENT_UPDATED' : 'EVENT_NEW'
    const title = isUpdate ? `Event Updated: ${event.title}` : `New Event Added: ${event.title}`

    // ── Create notification (with built-in duplicate prevention) ───────
    const result = await createPublicNotification({
      type: notificationType,
      category: 'EVENTS',
      title,
      message: event.tagline || event.description?.slice(0, 120) || event.title,
      targetUrl: `/events/${event.slug}`,
      source: 'EVENTS',
      sourceId,
      version: versionHash,
      expiresAt: event.date ? new Date(event.date) : null,
    })

    if (result === null) {
      // Duplicate — not an error, just a no-op
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: `Notification for event "${event.title}" is already up to date.`,
      })
    }

    return NextResponse.json({
      success: true,
      duplicate: false,
      notificationId: result.id,
      message: `Notification created for "${event.title}".`,
    })
  } catch (error) {
    console.error('[AnnounceEvent API] Failed:', error)
    return NextResponse.json(
      { error: 'Could not create event notification.' },
      { status: 500 }
    )
  }
}
