import { NextResponse } from 'next/server'
import { getRazorpayInstance } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

const MIN_AMOUNT_PAISE = 100

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, currency, receipt } = body

    if (!amount || typeof amount !== 'number' || amount < MIN_AMOUNT_PAISE) {
      return NextResponse.json(
        { error: `Amount must be a number and at least ${MIN_AMOUNT_PAISE} paise.` },
        { status: 400 }
      )
    }

    let razorpay
    try {
      razorpay = getRazorpayInstance()
    } catch (error) {
      console.error('Razorpay configuration error:', error)
      return NextResponse.json(
        { error: 'Payment gateway is not configured.' },
        { status: 401 }
      )
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    })

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    const err = error as { statusCode?: number; error?: { description?: string } }
    console.error('Razorpay create-order error:', error)

    if (err?.statusCode === 401) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: err?.error?.description || 'Failed to create order.' },
      { status: 500 }
    )
  }
}
