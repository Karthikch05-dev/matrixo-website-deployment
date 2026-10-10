/**
 * StudentVault pricing. Client-safe constants only; the live seat count is
 * resolved on the server (lib/studentvault/pricing.ts).
 *
 * Launch plan: the first FOUNDING_SEATS buyers pay the founding price, then
 * the regular price applies. No platform fee is charged on StudentVault.
 */
export const STUDENTVAULT_PRICING = {
  regular: 99,
  founding: 49,
  foundingSeats: 500,
} as const

export type PriceTier = 'founding' | 'regular'

export interface StudentVaultPrice {
  tier: PriceTier
  amount: number
  regular: number
  /** Founding seats still available, or 0 once the regular price applies. */
  foundingLeft: number
}

export function priceForTier(tier: PriceTier): number {
  return tier === 'founding' ? STUDENTVAULT_PRICING.founding : STUDENTVAULT_PRICING.regular
}

export function priceFromSold(sold: number): StudentVaultPrice {
  const left = Math.max(0, STUDENTVAULT_PRICING.foundingSeats - sold)
  const tier: PriceTier = left > 0 ? 'founding' : 'regular'
  return { tier, amount: priceForTier(tier), regular: STUDENTVAULT_PRICING.regular, foundingLeft: left }
}
