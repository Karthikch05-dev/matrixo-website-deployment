import { NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

    return NextResponse.json({ success: true, payment_id: paymentId, order_id: orderId })
  } catch (error) {
    console.error('Razorpay verify-payment error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment.' },
      { status: 500 }
    )
  }
}
