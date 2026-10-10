import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireEmployee } from '@/lib/studentvault/auth'
import { getGuide, GUIDES_COLLECTION } from '@/lib/studentvault/data'
import { requireUnlocked } from '@/lib/studentvault/verifyInput'

export const dynamic = 'force-dynamic'

type Params = { params: { offerId: string } }

/**
 * Paid guide content. Returned only to buyers who are verified students — it is
 * never sent to the browser and hidden with CSS, and the Firestore rules deny
 * client reads of this collection entirely.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const gate = await requireUnlocked(request)
    if (!gate.ok) return gate.response

    const guide = await getGuide(params.offerId)
    if (!guide) {
      return NextResponse.json(
        { error: 'No claim guide has been published for this offer yet.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ guide })
  } catch (error) {
    console.error('[StudentVault] guide read failed:', error)
    return NextResponse.json({ error: 'Could not load guide.' }, { status: 500 })
  }
}

/** Employees author and update claim guides. */
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()

    const claimSteps = Array.isArray(body.claimSteps)
      ? body.claimSteps
          .map((step: any) => ({
            title: typeof step?.title === 'string' ? step.title.trim() : '',
            body: typeof step?.body === 'string' ? step.body.trim() : '',
            ...(typeof step?.screenshotUrl === 'string' && step.screenshotUrl.trim()
              ? { screenshotUrl: step.screenshotUrl.trim() }
              : {}),
          }))
          .filter((s: any) => s.title && s.body)
      : []

    const toList = (v: unknown) =>
      Array.isArray(v)
        ? v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
        : []

    await getAdminFirestore()
      .collection(GUIDES_COLLECTION)
      .doc(params.offerId)
      .set(
        {
          offerId: params.offerId,
          claimSteps,
          failureModes: toList(body.failureModes),
          proTips: toList(body.proTips),
          updatedAt: new Date(),
          updatedBy: auth.employee.employeeId || auth.employee.uid,
        },
        { merge: true }
      )

    return NextResponse.json({ success: true, steps: claimSteps.length })
  } catch (error) {
    console.error('[StudentVault] guide write failed:', error)
    return NextResponse.json({ error: 'Could not save guide.' }, { status: 500 })
  }
}
