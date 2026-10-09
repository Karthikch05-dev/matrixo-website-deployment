import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import {
  getReadNotificationIds,
  markNotificationsAsRead,
} from '@/lib/publicNotifications'

export const dynamic = 'force-dynamic'

/**
 * GET — Fetch the current user's read notification IDs.
 *
 * Requires authentication (Bearer token).
 * Anonymous visitors handle read state client-side via localStorage.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  try {
    const readIds = await getReadNotificationIds(user.uid)
    return NextResponse.json({ readIds })
  } catch (error) {
    console.error('[ReadState API] GET failed:', error)
    return NextResponse.json(
      { error: 'Could not load read state.' },
      { status: 500 }
    )
  }
}

/**
 * POST — Mark notification(s) as read for the current user.
 *
 * Body: { notificationIds: string[] }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const ids = body?.notificationIds

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'notificationIds must be a non-empty array of strings.' },
        { status: 400 }
      )
    }

    // Sanitize: only strings, max 100 IDs per request
    const sanitized = ids
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      .slice(0, 100)

    if (sanitized.length === 0) {
      return NextResponse.json(
        { error: 'No valid notification IDs provided.' },
        { status: 400 }
      )
    }

    const success = await markNotificationsAsRead(user.uid, sanitized)
    if (!success) {
      return NextResponse.json(
        { error: 'Could not update read state.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, markedCount: sanitized.length })
  } catch (error) {
    console.error('[ReadState API] POST failed:', error)
    return NextResponse.json(
      { error: 'Could not update read state.' },
      { status: 500 }
    )
  }
}
