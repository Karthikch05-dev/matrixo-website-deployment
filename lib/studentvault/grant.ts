// Server-only: turn a paid Razorpay order into StudentVault access.
// Used by the checkout callback AND the webhook, so access is granted even if
// the buyer closes the tab before the browser reports back.
import { revalidateTag } from 'next/cache'
import { getRazorpayInstance } from '@/lib/razorpay'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { recordPayment } from '@/lib/payments/ledger'
import { ENTITLEMENTS_COLLECTION } from './data'
import { priceForTier, type PriceTier } from './pricingConfig'

export const STUDENTVAULT_PRODUCT_ID = 'studentvault'

export type GrantResult =
  | { ok: true; uid: string; alreadyActive: boolean }
  | { ok: false; status: number; error: string }

export async function grantFromOrder(params: {
  orderId: string
  paymentId: string
  source: 'checkout' | 'webhook'
  /** When set (checkout), the order must belong to this user. */
  expectedUid?: string
}): Promise<GrantResult> {
  const order = await getRazorpayInstance().orders.fetch(params.orderId)
  const notes = (order.notes ?? {}) as Record<string, string>

  if (notes.productId !== STUDENTVAULT_PRODUCT_ID) {
    return { ok: false, status: 400, error: 'This payment was not for StudentVault.' }
  }

  const tier = notes.priceTier as PriceTier
  if (tier !== 'founding' && tier !== 'regular') {
    return { ok: false, status: 400, error: 'This order has no valid price.' }
  }
  // The price was fixed when the order was created; confirm the paid amount
  // matches that tier exactly, so a cheaper order can't unlock anything else.
  if (Number(order.amount) !== priceForTier(tier) * 100) {
    return { ok: false, status: 400, error: 'Payment amount does not match the StudentVault price.' }
  }
  if (order.status !== 'paid') {
    return { ok: false, status: 400, error: 'Payment is not complete yet.' }
  }

  const uid = notes.uid
  if (!uid) return { ok: false, status: 400, error: 'This order is not linked to an account.' }
  if (params.expectedUid && params.expectedUid !== uid) {
    return { ok: false, status: 403, error: 'This payment belongs to another account.' }
  }

  const firestore = getAdminFirestore()

  // A payment can unlock exactly one account.
  const existing = await firestore
    .collection(ENTITLEMENTS_COLLECTION)
    .where('razorpayOrderId', '==', params.orderId)
    .limit(1)
    .get()
  if (!existing.empty && existing.docs[0].id !== uid) {
    return { ok: false, status: 409, error: 'This payment has already been used to unlock another account.' }
  }

  const ref = firestore.collection(ENTITLEMENTS_COLLECTION).doc(uid)
  const current = await ref.get()
  const alreadyActive = current.exists && current.data()?.active === true

  if (!alreadyActive) {
    await ref.set(
      {
        active: true,
        product: STUDENTVAULT_PRODUCT_ID,
        grantedAt: new Date(),
        razorpayPaymentId: params.paymentId,
        razorpayOrderId: params.orderId,
        amountPaid: priceForTier(tier),
        priceTier: tier,
        email: notes.email || null,
        grantedVia: params.source,
      },
      { merge: true }
    )
    try {
      revalidateTag('studentvault-sales')
    } catch {
      // Outside a request scope (e.g. tests) there is nothing to revalidate.
    }
  }

  await recordPayment({
    paymentId: params.paymentId,
    orderId: params.orderId,
    uid,
    email: notes.email || null,
    item: STUDENTVAULT_PRODUCT_ID,
    description: tier === 'founding' ? 'StudentVault pass — founding price' : 'StudentVault pass',
    amount: priceForTier(tier),
    currency: String(order.currency || 'INR'),
    status: 'captured',
    source: params.source,
  })

  return { ok: true, uid, alreadyActive }
}
