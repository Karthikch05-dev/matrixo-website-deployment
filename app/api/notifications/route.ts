import { NextRequest, NextResponse } from 'next/server'
import {
  getActivePublicNotifications,
  createPublicNotification,
  type NotificationCategory,
} from '@/lib/publicNotifications'
import { getPublishedOffers } from '@/lib/studentvault/data'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: NotificationCategory[] = ['EVENTS', 'STUDENTVAULT', 'PLATFORM']

/**
 * Public endpoint — NO authentication required.
 *
 * Returns active, non-expired public notifications sorted newest-first.
 *
 * Query params:
 *   ?limit=N       — max results (1–50, default 20)
 *   ?category=X    — filter by EVENTS | STUDENTVAULT | PLATFORM
 *   ?after=ID      — cursor-based pagination (pass the last notification ID)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    // ── Parse limit ──────────────────────────────────────────────────
    const rawLimit = searchParams.get('limit')
    const limit = rawLimit ? parseInt(rawLimit, 10) : undefined
    if (rawLimit && (Number.isNaN(limit) || (limit !== undefined && limit < 1))) {
      return NextResponse.json(
        { error: 'limit must be a positive integer.' },
        { status: 400 }
      )
    }

    // ── Parse category filter ────────────────────────────────────────
    const rawCategory = searchParams.get('category')?.toUpperCase() as
      | NotificationCategory
      | undefined
    if (rawCategory && !VALID_CATEGORIES.includes(rawCategory)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // ── Cursor ───────────────────────────────────────────────────────
    const afterId = searchParams.get('after') || undefined

    // ── Self-Healing Sync: Ensure existing StudentVault offers have notifications ──
    try {
      // Fetch published offers; this fails gracefully if Firebase isn't configured
      const publishedOffers = await getPublishedOffers()
      
      // We limit synchronization to only un-paginated requests or first page loads
      // to avoid repeatedly checking this on every infinite scroll request.
      if (!afterId && publishedOffers.length > 0) {
        // Run checks concurrently; createPublicNotification uses deduplication logic.
        await Promise.allSettled(
          publishedOffers.map(offer => 
            createPublicNotification({
              type: 'STUDENTVAULT_OFFER',
              category: 'STUDENTVAULT',
              title: `New StudentVault Offer: ${offer.name}`,
              message: offer.summary?.slice(0, 120) || `${offer.name} is now available on StudentVault.`,
              targetUrl: `/studentvault/${offer.slug}`,
              source: 'STUDENTVAULT',
              sourceId: offer.id,
              version: '1',
              expiresAt: offer.expiresOn ? new Date(offer.expiresOn) : null,
            })
          )
        )
      }
    } catch (syncError) {
      console.error('[Notifications API] Auto-sync of StudentVault offers failed:', syncError)
    }

    // ── Fetch active public notifications ────────────────────────────
    const result = await getActivePublicNotifications({
      limit,
      category: rawCategory,
      afterId,
    })

    // Strip internal fields — only return public-safe data
    const safeNotifications = result.notifications.map((n) => ({
      id: n.id,
      type: n.type,
      category: n.category,
      title: n.title,
      message: n.message,
      targetUrl: n.targetUrl,
      publishedAt: n.publishedAt,
      createdAt: n.createdAt,
    }))

    return NextResponse.json({
      notifications: safeNotifications,
      hasMore: result.hasMore,
    })
  } catch (error) {
    console.error('[Notifications API] GET failed:', error)
    return NextResponse.json(
      { error: 'Could not load notifications.' },
      { status: 500 }
    )
  }
}
