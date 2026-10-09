import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireEmployee } from '@/lib/studentvault/auth'
import { getAllOffers, OFFERS_COLLECTION, slugExists } from '@/lib/studentvault/data'
import { validateOffer } from '@/lib/studentvault/validation'
import { createPublicNotification } from '@/lib/publicNotifications'

export const dynamic = 'force-dynamic'

/** Employee console listing — includes drafts, so it is employee-only. */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const offers = await getAllOffers()
    return NextResponse.json({ offers })
  } catch (error) {
    console.error('[StudentVault] list offers failed:', error)
    return NextResponse.json({ error: 'Could not load offers.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await request.json()
    const { valid, errors, value } = validateOffer(body)

    if (!valid) {
      return NextResponse.json({ error: errors.join(' '), errors }, { status: 400 })
    }

    if (await slugExists(value.slug)) {
      return NextResponse.json(
        { error: `An offer with slug "${value.slug}" already exists.` },
        { status: 409 }
      )
    }

    // Publishing requires an explicit verification confirmation (§28). Without
    // it the offer is stored as a draft and stays invisible to the public.
    const publishRequested = body.publish === true
    const confirmedVerified = body.confirmVerified === true
    const now = new Date()

    if (publishRequested && !confirmedVerified) {
      return NextResponse.json(
        {
          error:
            'Confirm you have verified this offer against the provider\'s official source before publishing.',
        },
        { status: 400 }
      )
    }

    const doc = await getAdminFirestore()
      .collection(OFFERS_COLLECTION)
      .add({
        ...value,
        expiresOn: value.expiresOn ? new Date(value.expiresOn) : null,
        publishState: publishRequested ? 'published' : 'draft',
        lastVerifiedAt: publishRequested ? now : null,
        verifiedBy: publishRequested ? auth.employee.name || auth.employee.email : '',
        createdAt: now,
        updatedAt: now,
        createdBy: auth.employee.employeeId || auth.employee.uid,
      })

    // ── Auto-generate public notification on publish (non-fatal) ─────
    if (publishRequested) {
      await createPublicNotification({
        type: 'STUDENTVAULT_OFFER',
        category: 'STUDENTVAULT',
        title: `New Student Offer: ${value.name}`,
        message: value.summary.slice(0, 120) || `${value.name} is now available on StudentVault.`,
        targetUrl: `/studentvault/${value.slug}`,
        source: 'STUDENTVAULT',
        sourceId: doc.id,
        version: '1',
        expiresAt: value.expiresOn ? new Date(value.expiresOn) : null,
      })
    }

    return NextResponse.json({ success: true, id: doc.id, slug: value.slug })
  } catch (error) {
    console.error('[StudentVault] create offer failed:', error)
    return NextResponse.json({ error: 'Could not create offer.' }, { status: 500 })
  }
}
