import { NextRequest, NextResponse } from 'next/server'
import {
  getActivePublicNotifications,
  getCachedFirstPage,
  type NotificationCategory,
} from '@/lib/publicNotifications'

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
 *
 * Read-only by design: notifications are created when content is published
 * (offer publish, catalog import, event announce), never while serving reads.
 * The first page is served from a tag-invalidated cache and the CDN.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const rawLimit = searchParams.get('limit')
    const parsed = rawLimit ? parseInt(rawLimit, 10) : 20
    if (Number.isNaN(parsed) || parsed < 1) {
      return NextResponse.json({ error: 'limit must be a positive integer.' }, { status: 400 })
    }
    const limit = Math.min(parsed, 50)

    const rawCategory = searchParams.get('category')?.toUpperCase() as NotificationCategory | undefined
    if (rawCategory && !VALID_CATEGORIES.includes(rawCategory)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    const afterId = searchParams.get('after') || undefined

    const result = afterId
      ? await getActivePublicNotifications({ limit, category: rawCategory, afterId })
      : await getCachedFirstPage(limit, rawCategory ?? null)

    // Strip internal fields — only return public-safe data
    const notifications = result.notifications.map((n) => ({
      id: n.id,
      type: n.type,
      category: n.category,
      title: n.title,
      message: n.message,
      targetUrl: n.targetUrl,
      publishedAt: n.publishedAt,
      createdAt: n.createdAt,
    }))

    return NextResponse.json(
      { notifications, hasMore: result.hasMore },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } }
    )
  } catch (error) {
    console.error('[Notifications API] GET failed:', error)
    return NextResponse.json({ error: 'Could not load notifications.' }, { status: 500 })
  }
}
