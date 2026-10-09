import { NextRequest, NextResponse } from 'next/server'
import { resolveEmployee } from '@/lib/employeeIdentity'
import { deliverPush, ensureVapid, getSubscriptionsFor, safeTargetPath } from '@/lib/push/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/push/send — staff only.
 *
 * Sends a Web Push to the devices of the given employees. The caller must
 * present a Firebase ID token that resolves to an `Employees` record; the
 * subscriptions themselves are looked up server-side, so the client never
 * handles another person's push endpoint.
 *
 * Body: { recipientIds: string[], payload: { title, body, url?, type?, tag? } }
 */
export async function POST(request: NextRequest) {
  const identity = await resolveEmployee(request)
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error, code: identity.code }, { status: identity.status })
  }

  if (!ensureVapid()) {
    return NextResponse.json({ error: 'Push is not configured on this deployment.' }, { status: 503 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const recipientIds: unknown = body?.recipientIds
  const payload = body?.payload

  if (!Array.isArray(recipientIds) || recipientIds.length === 0 || recipientIds.length > 200) {
    return NextResponse.json({ error: 'recipientIds must be a non-empty array (max 200).' }, { status: 400 })
  }
  if (!payload || typeof payload.title !== 'string' || payload.title.trim() === '') {
    return NextResponse.json({ error: 'payload.title is required.' }, { status: 400 })
  }

  try {
    const subscriptions = await getSubscriptionsFor(recipientIds.map(String))
    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, failed: 0, expiredEmployees: [] })
    }

    const result = await deliverPush(subscriptions, {
      title: payload.title,
      body: typeof payload.body === 'string' ? payload.body : '',
      url: safeTargetPath(payload.url),
      type: typeof payload.type === 'string' ? payload.type : undefined,
      tag: typeof payload.tag === 'string' ? payload.tag.slice(0, 80) : undefined,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[push/send] delivery failed:', error)
    return NextResponse.json({ error: 'Could not send push notifications.' }, { status: 500 })
  }
}
