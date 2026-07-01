import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'

type ServiceAccountJson = {
  project_id: string
  client_email: string
  private_key: string
}

let adminApp: App | null = null

function loadServiceAccount(): ServiceAccountJson {
  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), '..', 'serviceAccountKey.json'),
  ].filter(Boolean) as string[]

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8')
      return JSON.parse(raw) as ServiceAccountJson
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccountJson
  }

  throw new Error('Firebase Admin service account not configured')
}

export function getAdminApp() {
  if (adminApp) return adminApp
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }

  const serviceAccount = loadServiceAccount()
  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
  })

  return adminApp
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp())
}
