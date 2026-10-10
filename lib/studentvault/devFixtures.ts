// Development only: when local Admin credentials can't reach Firestore, public
// pages render the researched catalog instead of an empty vault, so the UI
// can still be previewed. Never used in production builds.
import type { Offer } from './types'
import { CATALOG_RESEARCHED_AT, STARTER_CATALOG } from './catalog'

export const DEV_FIXTURES_ENABLED = process.env.NODE_ENV === 'development'

export function catalogAsOffers(): Offer[] {
  return STARTER_CATALOG.map((item, i) => ({
    id: `dev-${item.slug}`,
    slug: item.slug,
    name: item.name,
    category: item.category,
    officialUrl: '',
    summary: item.summary,
    whatYouGet: item.whatYouGet,
    valueInr: item.valueInr,
    eligibility: item.eligibility,
    indiaNote: item.indiaNote,
    status: item.status,
    statusNote: item.statusNote,
    expiresOn: item.expiresOn ? new Date(item.expiresOn).toISOString() : null,
    requiresCard: item.requiresCard,
    autoChargeNote: item.autoChargeNote,
    dependsOn: item.dependsOn,
    logoUrl: '',
    // A few rows look staff-checked so both badge states show up locally.
    lastVerifiedAt: i % 4 === 0 ? new Date().toISOString() : null,
    verifiedBy: i % 4 === 0 ? 'Dev fixture' : '',
    researchedAt: CATALOG_RESEARCHED_AT,
    publishState: 'published',
    createdAt: CATALOG_RESEARCHED_AT,
    updatedAt: CATALOG_RESEARCHED_AT,
  }))
}
