// Server-only: one record per captured payment, so a user's purchase history
// can be shown in their profile regardless of what they bought.
import { getAdminFirestore } from '@/lib/firebaseAdmin'

export const PAYMENTS_COLLECTION = 'payments'

export interface PaymentRecord {
  paymentId: string
  orderId: string
  uid: string | null
  email: string | null
  /** e.g. 'studentvault' or 'event:devagentic-2-0' */
  item: string
  description: string
  amount: number
  currency: string
  status: 'captured' | 'refunded'
  source: 'checkout' | 'webhook'
}

/** Idempotent: keyed by Razorpay payment id. */
export async function recordPayment(record: PaymentRecord): Promise<void> {
  try {
    const ref = getAdminFirestore().collection(PAYMENTS_COLLECTION).doc(record.paymentId)
    const existing = await ref.get()
    await ref.set(
      {
        ...record,
        email: record.email?.toLowerCase() ?? null,
        ...(existing.exists ? {} : { createdAt: new Date() }),
        updatedAt: new Date(),
      },
      { merge: true }
    )
  } catch (error) {
    // The payment itself already succeeded; history is best-effort.
    console.error('[payments] could not record payment:', error)
  }
}

export interface PaymentHistoryItem {
  paymentId: string
  item: string
  description: string
  amount: number
  currency: string
  status: string
  createdAt: string | null
}

function toItem(id: string, raw: Record<string, any>): PaymentHistoryItem {
  const created = raw.createdAt?.toDate?.() as Date | undefined
  return {
    paymentId: id,
    item: raw.item ?? '',
    description: raw.description ?? '',
    amount: typeof raw.amount === 'number' ? raw.amount : 0,
    currency: raw.currency ?? 'INR',
    status: raw.status ?? 'captured',
    createdAt: created ? created.toISOString() : null,
  }
}

/** Payments made while signed in, plus guest payments made with the same verified email. */
export async function getPaymentHistory(uid: string, email: string | null): Promise<PaymentHistoryItem[]> {
  const col = getAdminFirestore().collection(PAYMENTS_COLLECTION)
  const [byUid, byEmail] = await Promise.all([
    col.where('uid', '==', uid).limit(50).get(),
    email ? col.where('email', '==', email.toLowerCase()).limit(50).get() : null,
  ])
  const seen = new Map<string, PaymentHistoryItem>()
  byUid.forEach((d) => seen.set(d.id, toItem(d.id, d.data())))
  byEmail?.forEach((d) => {
    const raw = d.data()
    // Guest payments only — another account's purchase never shows here.
    if (!raw.uid || raw.uid === uid) seen.set(d.id, toItem(d.id, raw))
  })
  return Array.from(seen.values()).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}
