// Server-only: importing firebase-admin here keeps this out of client bundles.
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import type { ClaimItem, Offer, OfferGuide, StudentVaultEntitlement } from './types'

export const OFFERS_COLLECTION = 'studentvault_offers'
export const GUIDES_COLLECTION = 'studentvault_guides'
export const CLAIMS_COLLECTION = 'studentvault_claims'
export const ENTITLEMENTS_COLLECTION = 'studentvault_entitlements'

function toIso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  const maybe = value as { toDate?: () => Date }
  if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return null
}

function normalizeOffer(id: string, raw: Record<string, any>): Offer {
  return {
    id,
    slug: raw.slug ?? id,
    name: raw.name ?? '',
    category: raw.category ?? '',
    officialUrl: raw.officialUrl ?? '',
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
    publishState: raw.publishState === 'published' ? 'published' : 'draft',
    createdAt: toIso(raw.createdAt) ?? '',
    updatedAt: toIso(raw.updatedAt) ?? '',
  }
}

/**
 * Published offers only — safe for public pages.
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
    return []
  }
}

export async function getPublishedOfferBySlug(slug: string): Promise<Offer | null> {
  // Deliberately allowed to throw: a transient Firestore failure should surface
  // as an error (and let ISR keep serving the last good page) rather than be
  // cached as a permanent 404 for a URL that really exists.
  const snap = await getAdminFirestore()
    .collection(OFFERS_COLLECTION)
    .where('slug', '==', slug)
    .where('publishState', '==', 'published')
    .limit(1)
    .get()

  if (snap.empty) return null
  return normalizeOffer(snap.docs[0].id, snap.docs[0].data())
}

/** Every offer including drafts — employee console only. */
export async function getAllOffers(): Promise<Offer[]> {
  const snap = await getAdminFirestore().collection(OFFERS_COLLECTION).get()
  return snap.docs.map((d) => normalizeOffer(d.id, d.data()))
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const doc = await getAdminFirestore().collection(OFFERS_COLLECTION).doc(id).get()
  if (!doc.exists) return null
  return normalizeOffer(doc.id, doc.data() as Record<string, any>)
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

/** Server-side entitlement check. Never trust a client-supplied flag. */
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
