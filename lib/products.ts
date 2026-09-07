import { getPaymentBreakdown, PaymentBreakdown } from './payments'

export type ProductId = 'studentvault'

export interface ProductPlan {
  id: ProductId
  name: string
  /** Base price in rupees, before the platform fee. */
  price: number
  description: string
  /** Firestore collection holding per-user entitlements for this product. */
  entitlementCollection: string
}

export const PRODUCT_PLANS: Record<ProductId, ProductPlan> = {
  studentvault: {
    id: 'studentvault',
    name: 'StudentVault — Lifetime Access',
    price: 99,
    description:
      'Lifetime access to claim walkthroughs, the verification playbook, deadline radar, auto-charge guard and your personal claim tracker.',
    entitlementCollection: 'studentvault_entitlements',
  },
}

export function getProduct(productId: string): ProductPlan | null {
  return PRODUCT_PLANS[productId as ProductId] ?? null
}

export function getProductBreakdown(productId: string): PaymentBreakdown | null {
  const product = getProduct(productId)
  if (!product) return null
  return getPaymentBreakdown(product.price)
}
