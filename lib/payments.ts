export const PLATFORM_FEE = 5

export interface PaymentBreakdown {
  basePrice: number
  platformFee: number
  total: number
  isFree: boolean
}

export function getPaymentBreakdown(basePrice: number): PaymentBreakdown {
  const base = Math.max(0, Math.round(Number(basePrice) || 0))

  if (base === 0) {
    return { basePrice: 0, platformFee: 0, total: 0, isFree: true }
  }

  return {
    basePrice: base,
    platformFee: PLATFORM_FEE,
    total: base + PLATFORM_FEE,
    isFree: false,
  }
}
