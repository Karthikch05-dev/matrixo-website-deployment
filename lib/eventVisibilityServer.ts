import { getAdminFirestore } from '@/lib/firebaseAdmin'

/**
 * Server-side read of an event's admin visibility flag, so event pages can be
 * rendered (and cached) with their real content instead of waiting on a
 * client-side check. Fails open: if Firestore can't be reached, the page
 * renders normally and the client-side check still hides it.
 */
export async function isEventHiddenServer(slug: string): Promise<boolean> {
  try {
    const snap = await getAdminFirestore().collection('eventVisibility').doc(slug).get()
    return snap.exists && snap.data()?.hidden === true
  } catch {
    return false
  }
}
