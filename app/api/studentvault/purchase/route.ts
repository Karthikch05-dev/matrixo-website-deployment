import { NextRequest, NextResponse } from 'next/server'
import { getRazorpayInstance, verifyRazorpaySignature } from '@/lib/razorpay'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { getProductBreakdown } from '@/lib/products'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { ENTITLEMENTS_COLLECTION } from '@/lib/studentvault/data'

export const dynamic = 'force-dynamic'

const PRODUCT_ID = 'studentvault'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = body || {}

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment verification fields.' },
        { status: 400 }
      )
    }

    if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
      return NextResponse.json(
        { error: 'Payment signature verification failed.' },
        { status: 400 }
      )
    }

    // A valid signature only proves the payment is genuine — not that it was for
    // StudentVault or for the right amount. Re-read the order from Razorpay and
    // confirm both, so a cheap order (e.g. a ₹6 event ticket) cannot be replayed
    // to unlock a ₹104 product.
    const breakdown = getProductBreakdown(PRODUCT_ID)
    if (!breakdown) {
      return NextResponse.json({ error: 'Product unavailable.' }, { status: 500 })
    }

    const order = await getRazorpayInstance().orders.fetch(orderId)

    if (order.notes?.productId !== PRODUCT_ID) {
      return NextResponse.json(
        { error: 'This payment was not for StudentVault.' },
        { status: 400 }
      )
    }

    if (Number(order.amount) !== breakdown.total * 100) {
      return NextResponse.json(
        { error: 'Payment amount does not match the StudentVault price.' },
        { status: 400 }
      )
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Payment is not complete.' }, { status: 400 })
    }

    const firestore = getAdminFirestore()

    // Bind the order to the first user who redeems it so the same payment cannot
    // unlock multiple accounts.
    const existing = await firestore
      .collection(ENTITLEMENTS_COLLECTION)
      .where('razorpayOrderId', '==', orderId)
      .limit(1)
      .get()

    if (!existing.empty && existing.docs[0].id !== user.uid) {
      return NextResponse.json(
        { error: 'This payment has already been used to unlock another account.' },
        { status: 409 }
      )
    }

    await firestore.collection(ENTITLEMENTS_COLLECTION).doc(user.uid).set(
      {
        active: true,
        product: PRODUCT_ID,
        grantedAt: new Date(),
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        amountPaid: breakdown.total,
        email: user.email ?? null,
      },
      { merge: true }
    )

    return NextResponse.json({ success: true, active: true })
  } catch (error) {
    console.error('[StudentVault] purchase verification error:', error)
    return NextResponse.json({ error: 'Could not verify payment.' }, { status: 500 })
  }
}

/** Lets the client read its own entitlement state. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    }

    const doc = await getAdminFirestore()
      .collection(ENTITLEMENTS_COLLECTION)
      .doc(user.uid)
      .get()

    return NextResponse.json({ active: doc.exists && doc.data()?.active === true })
  } catch (error) {
    console.error('[StudentVault] entitlement read error:', error)
    return NextResponse.json({ error: 'Could not read entitlement.' }, { status: 500 })
  }
}
