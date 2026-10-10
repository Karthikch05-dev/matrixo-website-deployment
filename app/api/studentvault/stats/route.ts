import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireEmployee } from '@/lib/studentvault/auth'
import { ENTITLEMENTS_COLLECTION } from '@/lib/studentvault/data'
import { VERIFICATIONS_COLLECTION } from '@/lib/studentvault/verification'
import { getLivePrice } from '@/lib/studentvault/pricing'

export const dynamic = 'force-dynamic'

/** Staff: sales and verification numbers for the console. */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const db = getAdminFirestore()
    const [entitlements, verified, pending, price] = await Promise.all([
      db.collection(ENTITLEMENTS_COLLECTION).where('active', '==', true).select('amountPaid', 'priceTier', 'grantedAt').get(),
      db.collection(VERIFICATIONS_COLLECTION).where('status', '==', 'verified').count().get(),
      db.collection(VERIFICATIONS_COLLECTION).where('pendingReview', '==', true).count().get(),
      getLivePrice(),
    ])

    let revenue = 0
    let founding = 0
    let last7 = 0
    const weekAgo = Date.now() - 7 * 86_400_000
    entitlements.forEach((d) => {
      const raw = d.data()
      revenue += typeof raw.amountPaid === 'number' ? raw.amountPaid : 0
      if (raw.priceTier === 'founding') founding += 1
      const granted = raw.grantedAt?.toDate?.() as Date | undefined
      if (granted && granted.getTime() >= weekAgo) last7 += 1
    })

    return NextResponse.json({
      passes: entitlements.size,
      revenue,
      foundingSold: founding,
      soldLast7Days: last7,
      verifiedStudents: verified.data().count,
      pendingReviews: pending.data().count,
      price,
    })
  } catch (error) {
    console.error('[StudentVault] stats failed:', error)
    return NextResponse.json({ error: 'Could not load stats.' }, { status: 500 })
  }
}
