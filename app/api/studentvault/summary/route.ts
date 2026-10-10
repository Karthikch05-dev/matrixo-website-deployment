import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { getClaims, getPublishedOffers } from '@/lib/studentvault/data'
import { getStudentVaultAccess } from '@/lib/studentvault/access'
import { daysUntil } from '@/lib/studentvault/types'

export const dynamic = 'force-dynamic'

/** Small aggregate for the profile dashboard card. Safe for unpaid users. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    }

    const [access, offers] = await Promise.all([
      getStudentVaultAccess(user.uid),
      getPublishedOffers(),
    ])
    const active = access.paid

    const liveOffers = offers.filter((o) => o.status !== 'ended')

    if (!active) {
      return NextResponse.json({
        active: false,
        offerCount: liveOffers.length,
        totalValue: liveOffers.reduce((s, o) => s + (o.valueInr || 0), 0),
        claimedCount: 0,
        claimedValue: 0,
        nextExpiring: null,
        access,
      })
    }

    const claims = await getClaims(user.uid)
    const claimedSlugs = new Set(
      claims.filter((c) => c.status === 'claimed').map((c) => c.offerSlug)
    )

    const claimedValue = offers
      .filter((o) => claimedSlugs.has(o.slug))
      .reduce((s, o) => s + (o.valueInr || 0), 0)

    const upcoming = liveOffers
      .map((o) => ({ offer: o, days: daysUntil(o.expiresOn) }))
      .filter((x): x is { offer: (typeof liveOffers)[number]; days: number } =>
        x.days !== null && x.days >= 0
      )
      .sort((a, b) => a.days - b.days)[0]

    return NextResponse.json({
      active: true,
      offerCount: liveOffers.length,
      totalValue: liveOffers.reduce((s, o) => s + (o.valueInr || 0), 0),
      claimedCount: claimedSlugs.size,
      claimedValue,
      nextExpiring: upcoming
        ? { name: upcoming.offer.name, slug: upcoming.offer.slug, days: upcoming.days }
        : null,
      access,
    })
  } catch (error) {
    console.error('[StudentVault] summary failed:', error)
    return NextResponse.json({ error: 'Could not load summary.' }, { status: 500 })
  }
}
