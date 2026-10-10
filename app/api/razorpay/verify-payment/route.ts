import { NextRequest, NextResponse } from 'next/server'
import { getRazorpayInstance, verifyRazorpaySignature } from '@/lib/razorpay'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { recordPayment } from '@/lib/payments/ledger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = body

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields.' },
        { status: 400 }
      )
    }

    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature })

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed.' },
        { status: 400 }
      )
    }

    // Purchase history (best-effort): link the payment to the signed-in
    // account if there is one, otherwise to the email used at checkout.
    try {
      const [user, order] = await Promise.all([
        getAuthedUser(request).catch(() => null),
        getRazorpayInstance().orders.fetch(orderId),
      ])
      const notes = (order.notes ?? {}) as Record<string, string>
      await recordPayment({
        paymentId,
        orderId,
        uid: user?.uid ?? null,
        email: user?.email ?? notes.email ?? null,
        item: notes.eventId ? `event:${notes.eventId}` : notes.productId || 'payment',
        description: notes.description || (notes.eventId ? `Event ticket · ${notes.eventId}` : 'Payment'),
        amount: Number(order.amount) / 100,
        currency: String(order.currency || 'INR'),
        status: 'captured',
        source: 'checkout',
      })
    } catch (error) {
      console.error('[verify-payment] could not record payment history:', error)
    }

    return NextResponse.json({ success: true, payment_id: paymentId, order_id: orderId })
  } catch (error) {
    console.error('Razorpay verify-payment error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment.' },
      { status: 500 }
    )
  }
}
