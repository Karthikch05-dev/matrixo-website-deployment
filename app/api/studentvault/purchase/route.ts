import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { getStudentVaultAccess } from '@/lib/studentvault/access'
import { grantFromOrder } from '@/lib/studentvault/grant'

export const dynamic = 'force-dynamic'

/** Called by the checkout right after Razorpay reports success. */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const orderId = body?.razorpay_order_id
    const paymentId = body?.razorpay_payment_id
    const signature = body?.razorpay_signature

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment verification fields.' }, { status: 400 })
    }

    if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 })
    }

    const result = await grantFromOrder({ orderId, paymentId, source: 'checkout', expectedUid: user.uid })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const access = await getStudentVaultAccess(user.uid)
    return NextResponse.json({ success: true, active: true, access })
  } catch (error) {
    console.error('[StudentVault] purchase verification error:', error)
    return NextResponse.json({ error: 'Could not verify payment.' }, { status: 500 })
  }
}

/** Lets the client read its own access state. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    }
    const access = await getStudentVaultAccess(user.uid)
    return NextResponse.json({ active: access.paid, access })
  } catch (error) {
    console.error('[StudentVault] entitlement read error:', error)
    return NextResponse.json({ error: 'Could not read entitlement.' }, { status: 500 })
  }
}
