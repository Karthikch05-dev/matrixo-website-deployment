import { OFFER_CATEGORIES, OFFER_STATUSES, type OfferStatus } from './types'

export interface OfferInput {
  slug: string
  name: string
  category: string
  officialUrl: string
  summary: string
  whatYouGet: string[]
  valueInr: number
  eligibility: string[]
  indiaNote: string
  status: OfferStatus
  statusNote: string
  expiresOn: string | null
  requiresCard: boolean
  autoChargeNote: string
  dependsOn: string[]
  logoUrl: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  value: OfferInput
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0)
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Validates and normalizes an offer payload from the employee console. */
export function validateOffer(raw: Record<string, any>): ValidationResult {
  const errors: string[] = []

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) errors.push('Name is required.')

  const slug = (typeof raw.slug === 'string' && raw.slug.trim()
    ? raw.slug.trim().toLowerCase()
    : slugify(name))
  if (!slug) errors.push('Slug is required.')
  else if (!SLUG_PATTERN.test(slug)) {
    errors.push('Slug must be lowercase words separated by single hyphens.')
  }

  const category = typeof raw.category === 'string' ? raw.category.trim() : ''
  if (!category) errors.push('Category is required.')
  else if (!(OFFER_CATEGORIES as readonly string[]).includes(category)) {
    errors.push(`Category must be one of: ${OFFER_CATEGORIES.join(', ')}`)
  }

  const officialUrl = typeof raw.officialUrl === 'string' ? raw.officialUrl.trim() : ''
  if (!officialUrl) {
    errors.push('Official URL is required.')
  } else {
    try {
      const parsed = new URL(officialUrl)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        errors.push('Official URL must be an http(s) link.')
      }
    } catch {
      errors.push('Official URL is not a valid URL.')
    }
  }

  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : ''
  if (!summary) errors.push('Summary is required.')

  const status: OfferStatus = OFFER_STATUSES.includes(raw.status)
    ? raw.status
    : 'live'
  if (raw.status && !OFFER_STATUSES.includes(raw.status)) {
    errors.push(`Status must be one of: ${OFFER_STATUSES.join(', ')}`)
  }

  let expiresOn: string | null = null
  if (raw.expiresOn) {
    const parsed = new Date(raw.expiresOn)
    if (Number.isNaN(parsed.getTime())) {
      errors.push('Expiry date is not a valid date.')
    } else {
      expiresOn = parsed.toISOString()
    }
  }

  const valueInr = Number(raw.valueInr)
  if (raw.valueInr !== undefined && raw.valueInr !== '' && Number.isNaN(valueInr)) {
    errors.push('Estimated value must be a number.')
  }
  if (!Number.isNaN(valueInr) && valueInr < 0) {
    errors.push('Estimated value cannot be negative.')
  }

  const requiresCard = Boolean(raw.requiresCard)
  const autoChargeNote =
    typeof raw.autoChargeNote === 'string' ? raw.autoChargeNote.trim() : ''

  // A card-required offer without a note is exactly the case that costs students
  // real money, so the note is mandatory there.
  if (requiresCard && !autoChargeNote) {
    errors.push('An auto-charge note is required when the offer needs a card.')
  }

  const statusNote = typeof raw.statusNote === 'string' ? raw.statusNote.trim() : ''
  if ((status === 'changed' || status === 'ended') && !statusNote) {
    errors.push(`A status note is required when status is "${status}".`)
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      slug,
      name,
      category,
      officialUrl,
      summary,
      whatYouGet: asStringArray(raw.whatYouGet),
      valueInr: Number.isNaN(valueInr) ? 0 : Math.max(0, Math.round(valueInr)),
      eligibility: asStringArray(raw.eligibility),
      indiaNote: typeof raw.indiaNote === 'string' ? raw.indiaNote.trim() : '',
      status,
      statusNote,
      expiresOn,
      requiresCard,
      autoChargeNote,
      dependsOn: asStringArray(raw.dependsOn).map((s) => s.toLowerCase()),
      logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl.trim() : '',
    },
  }
}
