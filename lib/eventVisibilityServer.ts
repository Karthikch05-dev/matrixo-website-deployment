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

/**
 * Slugs an admin has hidden, read once for the whole listing. Fails open (an
 * empty set) so a Firestore hiccup never empties the events page.
 */
export async function getHiddenEventSlugs(): Promise<Set<string>> {
  try {
    const snap = await getAdminFirestore().collection('eventVisibility').where('hidden', '==', true).get()
    return new Set(snap.docs.map((doc) => (doc.data()?.eventSlug as string | undefined) || doc.id))
  } catch {
    return new Set()
  }
}
