import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { deliverPush, ensureVapid, getSubscriptionsFor } from '@/lib/push/server'

export const dynamic = 'force-dynamic'

/** An application can only trigger its alert shortly after it was submitted. */
const FRESH_WINDOW_MS = 15 * 60 * 1000

/**
 * POST /api/push/application — public, but constrained.
 *
 * Applicants are not signed in, so they cannot call /api/push/send. Instead
 * they hand us the id of the application they just created. The server reads
 * that record, checks it is fresh and has not already been announced, and
 * sends a fixed-format alert to admins. The caller controls nothing about the
 * message or its recipients, and each application can alert at most once.
 *
 * Body: { applicationId: string }
 */
export async function POST(request: NextRequest) {
  let applicationId: unknown
  try {
    applicationId = (await request.json())?.applicationId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (typeof applicationId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(applicationId)) {
    return NextResponse.json({ error: 'A valid applicationId is required.' }, { status: 400 })
  }

  if (!ensureVapid()) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  try {
    const firestore = getAdminFirestore()
    const ref = firestore.collection('applications').doc(applicationId)

    // Claim the alert inside a transaction so two concurrent calls can't both send.
    const application = await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) return null
      const data = snap.data() as Record<string, any>
      if (data.pushNotifiedAt) return null

      const submittedAt: Date | null = data.submittedAt?.toDate?.() ?? null
      if (!submittedAt || Date.now() - submittedAt.getTime() > FRESH_WINDOW_MS) return null

      tx.update(ref, { pushNotifiedAt: new Date() })
      return data
    })

    if (!application) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const admins = await firestore.collection('Employees').where('role', '==', 'admin').get()
    const adminIds = admins.docs
      .map((doc) => doc.data()?.employeeId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)

    const subscriptions = await getSubscriptionsFor(adminIds)
    if (subscriptions.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    const name = String(application.fullName || 'Someone').slice(0, 60)
    const role = String(application.roleTitle || 'a role').slice(0, 80)
    const general = application.isGeneralApplication === true

    const result = await deliverPush(subscriptions, {
      title: general ? 'New general application' : `New application: ${role}`,
      body: general
        ? `${name} submitted a general interest application for "${role}".`
        : `${name} applied for the ${role} position.`,
      url: '/employee-portal',
      type: 'application',
      tag: `application-${applicationId}`,
    })

    return NextResponse.json({ ok: true, sent: result.sent })
  } catch (error) {
    console.error('[push/application] failed:', error)
    return NextResponse.json({ error: 'Could not send the alert.' }, { status: 500 })
  }
}
