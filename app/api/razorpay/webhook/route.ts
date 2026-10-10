import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { grantFromOrder, STUDENTVAULT_PRODUCT_ID } from '@/lib/studentvault/grant'
import { recordPayment } from '@/lib/payments/ledger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/razorpay/webhook
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://matrixo.in/api/razorpay/webhook
 *   Secret: the value of RAZORPAY_WEBHOOK_SECRET
 *   Events: order.paid, payment.captured
 *
 * Backup path for granting access and recording payments when the buyer's
 * browser never reports back (closed tab, flaky network). Every action here is
 * idempotent, so receiving both events — or the checkout callback first — is safe.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 })
  }

  const raw = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  if (event?.event !== 'order.paid' && event?.event !== 'payment.captured') {
    return NextResponse.json({ ok: true, ignored: event?.event ?? 'unknown' })
  }

  const payment = event?.payload?.payment?.entity
  const order = event?.payload?.order?.entity
  const orderId: string | undefined = order?.id || payment?.order_id
  const paymentId: string | undefined = payment?.id
  if (!orderId || !paymentId) {
    return NextResponse.json({ ok: true, ignored: 'no order/payment id' })
  }

  const notes = (order?.notes || payment?.notes || {}) as Record<string, string>

  try {
    if (notes.productId === STUDENTVAULT_PRODUCT_ID) {
      const result = await grantFromOrder({ orderId, paymentId, source: 'webhook' })
      if (!result.ok && result.status >= 500) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ ok: true, granted: result.ok })
    }

    // Event tickets and anything else: keep the purchase history complete.
    await recordPayment({
      paymentId,
      orderId,
      uid: notes.uid || null,
      email: notes.email || payment?.email || null,
      item: notes.eventId ? `event:${notes.eventId}` : notes.productId || 'payment',
      description: notes.description || (notes.eventId ? `Event ticket · ${notes.eventId}` : 'Payment'),
      amount: Number(payment?.amount ?? order?.amount ?? 0) / 100,
      currency: String(payment?.currency || order?.currency || 'INR'),
      status: 'captured',
      source: 'webhook',
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[razorpay webhook] handling failed:', error)
    // 500 makes Razorpay retry later.
    return NextResponse.json({ error: 'Could not process event.' }, { status: 500 })
  }
}
