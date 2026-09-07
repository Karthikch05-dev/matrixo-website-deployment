export type OfferStatus = 'live' | 'changed' | 'ended'

// Offers start unverified and stay invisible to the public until an employee
// explicitly verifies them against the provider's official source.
export type OfferPublishState = 'draft' | 'published'

export const OFFER_CATEGORIES = [
  'AI & LLM tools',
  'IDEs & developer tools',
  'Cloud credits',
  'Design',
  'Productivity',
  'Learning & MOOCs',
  'Certifications',
  'Internships',
  'Hackathons & competitions',
  'Hosting & infrastructure',
  'Communities',
  'Ambassador programs',
  'Scholarships & funding',
  'Hardware & discounts',
] as const

export type OfferCategory = (typeof OFFER_CATEGORIES)[number]

export interface Offer {
  id: string
  slug: string
  name: string
  category: OfferCategory | string
  officialUrl: string
  summary: string
  whatYouGet: string[]
  valueInr: number
  eligibility: string[]
  indiaNote: string
  status: OfferStatus
  statusNote: string
  /** ISO date string, or null when the offer has no deadline. */
  expiresOn: string | null
  requiresCard: boolean
  autoChargeNote: string
  /** Slugs of offers that should be claimed first (e.g. the GitHub Student Pack). */
  dependsOn: string[]
  logoUrl: string
  /** ISO timestamp. Null until an employee has verified the offer. */
  lastVerifiedAt: string | null
  /** Display name of the employee who last verified. */
  verifiedBy: string
  publishState: OfferPublishState
  createdAt: string
  updatedAt: string
}

export interface ClaimStep {
  title: string
  body: string
  screenshotUrl?: string
}

export interface OfferGuide {
  offerId: string
  claimSteps: ClaimStep[]
  failureModes: string[]
  proTips: string[]
  updatedAt: string
}

export type ClaimStatus = 'todo' | 'claimed' | 'rejected' | 'expired'

export interface ClaimItem {
  offerSlug: string
  status: ClaimStatus
  claimedAt: string | null
  renewBy: string | null
  notes: string
  updatedAt: string
}

export interface StudentVaultEntitlement {
  active: boolean
  grantedAt: string
  razorpayPaymentId: string
  razorpayOrderId: string
  amountPaid: number
}

export const OFFER_STATUSES: OfferStatus[] = ['live', 'changed', 'ended']
export const CLAIM_STATUSES: ClaimStatus[] = ['todo', 'claimed', 'rejected', 'expired']

export function isOfferPubliclyVisible(offer: Pick<Offer, 'publishState'>): boolean {
  return offer.publishState === 'published'
}

export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}
