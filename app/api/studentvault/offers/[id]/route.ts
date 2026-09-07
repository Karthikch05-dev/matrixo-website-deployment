import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireEmployee } from '@/lib/studentvault/auth'
import { getOfferById, OFFERS_COLLECTION, slugExists } from '@/lib/studentvault/data'
import { validateOffer } from '@/lib/studentvault/validation'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const offer = await getOfferById(params.id)
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found.' }, { status: 404 })
  }
  return NextResponse.json({ offer })
}

/**
 * Edits an offer. Editing content is deliberately NOT the same as verifying it,
 * so lastVerifiedAt is left untouched here (§29) — only the explicit
 * "verify" action below refreshes it.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const existing = await getOfferById(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Offer not found.' }, { status: 404 })
    }

    const body = await request.json()
    const action = body.action as string | undefined

    // ── "Verify Today" ─────────────────────────────────────────────────
    if (action === 'verify') {
      const now = new Date()
      await getAdminFirestore()
        .collection(OFFERS_COLLECTION)
        .doc(params.id)
        .update({
          lastVerifiedAt: now,
          verifiedBy: auth.employee.name || auth.employee.email || 'matriXO employee',
          updatedAt: now,
        })
      return NextResponse.json({
        success: true,
        lastVerifiedAt: now.toISOString(),
        verifiedBy: auth.employee.name || auth.employee.email,
      })
    }

    // ── Publish / unpublish ────────────────────────────────────────────
    if (action === 'publish' || action === 'unpublish') {
      if (action === 'publish' && body.confirmVerified !== true) {
        return NextResponse.json(
          {
            error:
              'Confirm you have verified this offer against the provider’s official source before publishing.',
          },
          { status: 400 }
        )
      }
      const now = new Date()
      const update: Record<string, unknown> = {
        publishState: action === 'publish' ? 'published' : 'draft',
        updatedAt: now,
      }
      if (action === 'publish') {
        update.lastVerifiedAt = now
        update.verifiedBy = auth.employee.name || auth.employee.email || 'matriXO employee'
      }
      await getAdminFirestore().collection(OFFERS_COLLECTION).doc(params.id).update(update)
      return NextResponse.json({ success: true, publishState: update.publishState })
    }

    // ── Full field edit ────────────────────────────────────────────────
    const { valid, errors, value } = validateOffer({ ...existing, ...body })
    if (!valid) {
      return NextResponse.json({ error: errors.join(' '), errors }, { status: 400 })
    }

    if (value.slug !== existing.slug && (await slugExists(value.slug, params.id))) {
      return NextResponse.json(
        { error: `An offer with slug "${value.slug}" already exists.` },
        { status: 409 }
      )
    }

    await getAdminFirestore()
      .collection(OFFERS_COLLECTION)
      .doc(params.id)
      .update({
        ...value,
        expiresOn: value.expiresOn ? new Date(value.expiresOn) : null,
        updatedAt: new Date(),
        updatedBy: auth.employee.employeeId || auth.employee.uid,
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[StudentVault] update offer failed:', error)
    return NextResponse.json({ error: 'Could not update offer.' }, { status: 500 })
  }
}

/**
 * Offers are never hard-deleted (§33) — an "ended" offer keeps its public
 * archive page so students who already claimed it still have the history.
 */
export async function DELETE() {
  return NextResponse.json(
    {
      error:
        'Offers cannot be deleted. Set the status to "ended" instead — it moves to the public archive.',
    },
    { status: 405 }
  )
}
