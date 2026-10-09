import { NextRequest, NextResponse } from 'next/server'
import { requireManager } from '@/lib/employeeIdentity'
import { deliverPush, ensureVapid, getAllSubscriptions, getSubscriptionsFor } from '@/lib/push/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/push/test — Admin / Co-Admin only.
 *
 * Sends a test notification. By default it goes only to the caller's own
 * devices; pass { "everyone": true } to test every registered device.
 */
export async function POST(request: NextRequest) {
  const identity = await requireManager(request)
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error, code: identity.code }, { status: identity.status })
  }

  if (!ensureVapid()) {
    return NextResponse.json({ error: 'Push is not configured on this deployment.' }, { status: 503 })
  }

  let everyone = false
  try {
    everyone = (await request.json())?.everyone === true
  } catch {
    // An empty body just means "my devices only".
  }

  const own = identity.employee.employeeId
  const subscriptions = everyone ? await getAllSubscriptions() : own ? await getSubscriptionsFor([own]) : []

  if (subscriptions.length === 0) {
    return NextResponse.json(
      { error: 'No registered devices found. Open the employee portal and allow notifications first.' },
      { status: 404 }
    )
  }

  const result = await deliverPush(subscriptions, {
    title: 'matriXO push test',
    body: 'Push notifications are working on this device.',
    url: '/employee-portal',
    type: 'test',
    tag: 'test-notification',
  })

  return NextResponse.json({ message: `Test push sent to ${result.sent}/${subscriptions.length} devices`, ...result })
}
