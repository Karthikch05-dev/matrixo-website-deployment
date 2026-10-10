// Server-only: importing firebase-admin here keeps this out of client bundles.
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import type { ClaimItem, Offer, OfferGuide, StudentVaultEntitlement } from './types'
import { DEV_FIXTURES_ENABLED, catalogAsOffers } from './devFixtures'

export const OFFERS_COLLECTION = 'studentvault_offers'
export const GUIDES_COLLECTION = 'studentvault_guides'
export const CLAIMS_COLLECTION = 'studentvault_claims'
export const ENTITLEMENTS_COLLECTION = 'studentvault_entitlements'
/**
 * Claim links live here, NOT on the offer document. Offer documents are
 * publicly readable (Firestore rules + public pages); this collection has no
 * client rule at all, so only the server can read it and hand links to
 * buyers who have unlocked the vault.
 */
export const LINKS_COLLECTION = 'studentvault_offer_links'

function toIso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  const maybe = value as { toDate?: () => Date }
  if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return null
}

function normalizeOffer(id: string, raw: Record<string, any>, officialUrl = ''): Offer {
  return {
    id,
    slug: raw.slug ?? id,
    name: raw.name ?? '',
    category: raw.category ?? '',
    officialUrl,
    summary: raw.summary ?? '',
    whatYouGet: Array.isArray(raw.whatYouGet) ? raw.whatYouGet : [],
    valueInr: typeof raw.valueInr === 'number' ? raw.valueInr : 0,
    eligibility: Array.isArray(raw.eligibility) ? raw.eligibility : [],
    indiaNote: raw.indiaNote ?? '',
    status: raw.status ?? 'live',
    statusNote: raw.statusNote ?? '',
    expiresOn: toIso(raw.expiresOn),
    requiresCard: Boolean(raw.requiresCard),
    autoChargeNote: raw.autoChargeNote ?? '',
    dependsOn: Array.isArray(raw.dependsOn) ? raw.dependsOn : [],
    logoUrl: raw.logoUrl ?? '',
    lastVerifiedAt: toIso(raw.lastVerifiedAt),
    verifiedBy: raw.verifiedBy ?? '',
    researchedAt: toIso(raw.researchedAt),
    publishState: raw.publishState === 'published' ? 'published' : 'draft',
    createdAt: toIso(raw.createdAt) ?? '',
    updatedAt: toIso(raw.updatedAt) ?? '',
  }
}

/**
 * Published offers only — safe for public pages. Claim links are never
 * included; they come from getOfferLinks() for unlocked buyers.
 *
 * Degrades to an empty catalog rather than throwing: a Firestore outage or a
 * build environment without Admin credentials should render the "catalog is
 * being verified" empty state, not a 500 on every public page.
 */
export async function getPublishedOffers(): Promise<Offer[]> {
  try {
    const snap = await getAdminFirestore()
      .collection(OFFERS_COLLECTION)
      .where('publishState', '==', 'published')
      .get()

    return snap.docs
      .map((d) => normalizeOffer(d.id, d.data()))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('[StudentVault] could not load published offers:', error)
    return DEV_FIXTURES_ENABLED ? catalogAsOffers() : []
  }
}

export async function getPublishedOfferBySlug(slug: string): Promise<Offer | null> {
  // Query by slug only (single-field, auto-indexed) to avoid requiring a
  // Firestore composite index on (slug, publishState). The publishState check
  // is done in application code below.
  //
  // Deliberately allowed to throw on transient Firestore failures so ISR keeps
  // serving the last good page rather than caching a permanent 404.
  let snap
  try {
    snap = await getAdminFirestore().collection(OFFERS_COLLECTION).where('slug', '==', slug).limit(1).get()
  } catch (error) {
    if (DEV_FIXTURES_ENABLED) return catalogAsOffers().find((o) => o.slug === slug) ?? null
    throw error
  }

  if (snap.empty) return null
  const offer = normalizeOffer(snap.docs[0].id, snap.docs[0].data())
  if (offer.publishState !== 'published') return null
  return offer
}

/** offerId -> claim URL. Falls back to the legacy field on the offer doc. */
export async function getOfferLinks(offerIds?: string[]): Promise<Record<string, string>> {
  const firestore = getAdminFirestore()
  const links: Record<string, string> = {}

  const snap = await firestore.collection(LINKS_COLLECTION).get()
  snap.forEach((doc) => {
    const url = doc.data()?.officialUrl
    if (typeof url === 'string' && url) links[doc.id] = url
  })

  // Offers created before links moved out of the public doc.
  const offers = await firestore.collection(OFFERS_COLLECTION).get()
  offers.forEach((doc) => {
    const legacy = doc.data()?.officialUrl
    if (!links[doc.id] && typeof legacy === 'string' && legacy) links[doc.id] = legacy
  })

  if (!offerIds) return links
  return Object.fromEntries(offerIds.filter((id) => links[id]).map((id) => [id, links[id]]))
}

export async function setOfferLink(offerId: string, officialUrl: string): Promise<void> {
  await getAdminFirestore()
    .collection(LINKS_COLLECTION)
    .doc(offerId)
    .set({ officialUrl, updatedAt: new Date() }, { merge: true })
}

/** Every offer including drafts, with links — employee console only. */
export async function getAllOffers(): Promise<Offer[]> {
  const [snap, links] = await Promise.all([
    getAdminFirestore().collection(OFFERS_COLLECTION).get(),
    getOfferLinks(),
  ])
  return snap.docs.map((d) => normalizeOffer(d.id, d.data(), links[d.id] ?? ''))
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const firestore = getAdminFirestore()
  const [doc, link] = await Promise.all([
    firestore.collection(OFFERS_COLLECTION).doc(id).get(),
    firestore.collection(LINKS_COLLECTION).doc(id).get(),
  ])
  if (!doc.exists) return null
  const raw = doc.data() as Record<string, any>
  const url = (link.exists && link.data()?.officialUrl) || raw.officialUrl || ''
  return normalizeOffer(doc.id, raw, url)
}

export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
  const snap = await getAdminFirestore()
    .collection(OFFERS_COLLECTION)
    .where('slug', '==', slug)
    .get()
  return snap.docs.some((d) => d.id !== exceptId)
}

export async function getGuide(offerId: string): Promise<OfferGuide | null> {
  const doc = await getAdminFirestore().collection(GUIDES_COLLECTION).doc(offerId).get()
  if (!doc.exists) return null
  const raw = doc.data() as Record<string, any>
  return {
    offerId,
    claimSteps: Array.isArray(raw.claimSteps) ? raw.claimSteps : [],
    failureModes: Array.isArray(raw.failureModes) ? raw.failureModes : [],
    proTips: Array.isArray(raw.proTips) ? raw.proTips : [],
    updatedAt: toIso(raw.updatedAt) ?? '',
  }
}

/** Server-side payment check. Never trust a client-supplied flag. */
export async function hasStudentVaultAccess(uid: string): Promise<boolean> {
  const doc = await getAdminFirestore()
    .collection(ENTITLEMENTS_COLLECTION)
    .doc(uid)
    .get()
  return doc.exists && doc.data()?.active === true
}

export async function getEntitlement(
  uid: string
): Promise<StudentVaultEntitlement | null> {
  const doc = await getAdminFirestore()
    .collection(ENTITLEMENTS_COLLECTION)
    .doc(uid)
    .get()
  if (!doc.exists) return null
  const raw = doc.data() as Record<string, any>
  return {
    active: raw.active === true,
    grantedAt: toIso(raw.grantedAt) ?? '',
    razorpayPaymentId: raw.razorpayPaymentId ?? '',
    razorpayOrderId: raw.razorpayOrderId ?? '',
    amountPaid: typeof raw.amountPaid === 'number' ? raw.amountPaid : 0,
    priceTier: raw.priceTier === 'founding' || raw.priceTier === 'regular' ? raw.priceTier : null,
  }
}

export async function getClaims(uid: string): Promise<ClaimItem[]> {
  const snap = await getAdminFirestore()
    .collection(CLAIMS_COLLECTION)
    .doc(uid)
    .collection('items')
    .get()

  return snap.docs.map((d) => {
    const raw = d.data() as Record<string, any>
    return {
      offerSlug: raw.offerSlug ?? d.id,
      status: raw.status ?? 'todo',
      claimedAt: toIso(raw.claimedAt),
      renewBy: toIso(raw.renewBy),
      notes: raw.notes ?? '',
      updatedAt: toIso(raw.updatedAt) ?? '',
    }
  })
}
