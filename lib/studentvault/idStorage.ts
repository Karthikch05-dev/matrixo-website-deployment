// Server-only: private storage for student ID uploads. Files are written with
// the Admin SDK under a path the client Storage rules never allow, and staff
// see them only through short-lived signed URLs.
import { getStorage } from 'firebase-admin/storage'
import { getAdminApp } from '@/lib/firebaseAdmin'

export const ID_UPLOAD_RULES = {
  maxBytes: 4 * 1024 * 1024,
  types: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  } as Record<string, string>,
} as const

function bucket() {
  const app = getAdminApp()
  const name =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    `${app.options.projectId ?? ''}.appspot.com`
  return getStorage(app).bucket(name)
}

export async function saveIdUpload(uid: string, data: Buffer, contentType: string): Promise<string> {
  const ext = ID_UPLOAD_RULES.types[contentType] ?? 'bin'
  const path = `student-verification/${uid}/${Date.now()}.${ext}`
  await bucket().file(path).save(data, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'private, max-age=0, no-store' },
  })
  return path
}

export async function deleteIdUpload(path: string): Promise<void> {
  await bucket().file(path).delete({ ignoreNotFound: true })
}

export async function signedIdUrl(path: string): Promise<string | null> {
  try {
    const [url] = await bucket()
      .file(path)
      .getSignedUrl({ action: 'read', expires: Date.now() + 15 * 60 * 1000 })
    return url
  } catch (error) {
    console.error('[StudentVault] could not sign ID url:', error)
    return null
  }
}
