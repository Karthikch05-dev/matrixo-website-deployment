// Server-only: reads the live sales count with the Admin SDK.
import { unstable_cache } from 'next/cache'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { ENTITLEMENTS_COLLECTION } from './data'
import { priceFromSold, type StudentVaultPrice } from './pricingConfig'

async function countSold(): Promise<number> {
  const snap = await getAdminFirestore()
    .collection(ENTITLEMENTS_COLLECTION)
    .where('active', '==', true)
    .count()
    .get()
  return snap.data().count
}

/** Exact, uncached price — used when creating an order. */
export async function getLivePrice(): Promise<StudentVaultPrice> {
  try {
    return priceFromSold(await countSold())
  } catch (error) {
    // If the count can't be read, charge the regular price rather than
    // risk selling below it.
    console.error('[StudentVault] could not count sales:', error)
    return priceFromSold(Number.MAX_SAFE_INTEGER)
  }
}

/** Cached for display on public pages (refreshes every minute). */
export const getDisplayPrice = unstable_cache(
  async (): Promise<StudentVaultPrice> => {
    try {
      return priceFromSold(await countSold())
    } catch {
      return priceFromSold(0)
    }
  },
  ['studentvault-display-price'],
  { revalidate: 60, tags: ['studentvault-sales'] }
)
