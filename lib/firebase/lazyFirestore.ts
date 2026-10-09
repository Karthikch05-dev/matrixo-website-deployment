/**
 * Loads the Firestore SDK on demand. The site shell (profile context, navbar)
 * calls this instead of importing Firestore at the top of the file, so pages
 * that never touch Firestore don't download or evaluate it.
 */
export async function loadFirestore() {
  const [sdk, { db }] = await Promise.all([import('firebase/firestore'), import('./db')])
  return { ...sdk, db }
}
