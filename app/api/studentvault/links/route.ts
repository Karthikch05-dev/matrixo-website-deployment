import { NextRequest, NextResponse } from 'next/server'
import { getOfferLinks, getPublishedOffers } from '@/lib/studentvault/data'
import { requireUnlocked } from '@/lib/studentvault/verifyInput'

export const dynamic = 'force-dynamic'

/** Claim links, keyed by offer slug — only for buyers who are also verified students. */
export async function GET(request: NextRequest) {
  const gate = await requireUnlocked(request)
  if (!gate.ok) return gate.response

  try {
    const offers = await getPublishedOffers()
    const links = await getOfferLinks(offers.map((o) => o.id))
    const bySlug = Object.fromEntries(offers.filter((o) => links[o.id]).map((o) => [o.slug, links[o.id]]))
    return NextResponse.json({ links: bySlug }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[StudentVault] links read failed:', error)
    return NextResponse.json({ error: 'Could not load links.' }, { status: 500 })
  }
}
