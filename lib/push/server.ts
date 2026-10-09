import webPush from 'web-push'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

/**
 * Server-side Web Push delivery. Every push to staff devices goes through here,
 * so subscriptions are only ever read with the Admin SDK — clients never need
 * read access to `pushSubscriptions`.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

let vapidReady = false

export function ensureVapid(): boolean {
  if (vapidReady) return true
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  webPush.setVapidDetails('mailto:admin@matrixo.in', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidReady = true
  return true
}

export interface PushMessage {
  title: string
  body: string
  /** Same-origin path opened when the notification is tapped. */
  url?: string
  type?: string
  tag?: string
}

interface StoredSubscription {
  employeeId: string
  endpoint: string
  keys: { p256dh: string; auth: string }
}

const MAX_TITLE = 120
const MAX_BODY = 300

/** Only same-origin paths may be opened from a notification. */
export function safeTargetPath(url: unknown, fallback = '/employee-portal'): string {
  if (typeof url !== 'string') return fallback
  const trimmed = url.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  return trimmed.slice(0, 300)
}

export async function getSubscriptionsFor(employeeIds: string[]): Promise<StoredSubscription[]> {
  const ids = Array.from(new Set(employeeIds.filter((id) => typeof id === 'string' && id.length > 0)))
  if (ids.length === 0) return []

  const firestore = getAdminFirestore()
  const found: StoredSubscription[] = []

  // Firestore `in` accepts at most 30 values per query.
  for (let i = 0; i < ids.length; i += 30) {
    const snap = await firestore
      .collection('pushSubscriptions')
      .where('employeeId', 'in', ids.slice(i, i + 30))
      .get()

    snap.forEach((doc) => {
      const data = doc.data() as Record<string, any>
      const sub = data.subscription
      if (sub?.endpoint && sub?.keys?.p256dh && sub?.keys?.auth) {
        found.push({ employeeId: data.employeeId, endpoint: sub.endpoint, keys: sub.keys })
      }
    })
  }

  return found
}

export async function getAllSubscriptions(): Promise<StoredSubscription[]> {
  const snap = await getAdminFirestore().collection('pushSubscriptions').get()
  const found: StoredSubscription[] = []
  snap.forEach((doc) => {
    const data = doc.data() as Record<string, any>
    const sub = data.subscription
    if (sub?.endpoint && sub?.keys?.p256dh && sub?.keys?.auth) {
      found.push({ employeeId: data.employeeId ?? 'unknown', endpoint: sub.endpoint, keys: sub.keys })
    }
  })
  return found
}

export async function deliverPush(subscriptions: StoredSubscription[], message: PushMessage) {
  const payload = JSON.stringify({
    title: message.title.slice(0, MAX_TITLE),
    body: (message.body || '').slice(0, MAX_BODY),
    icon: '/brand/matrixo-app-icon-192.png',
    badge: '/brand/matrixo-app-icon-192.png',
    tag: message.tag || `notification-${Date.now()}`,
    data: { url: safeTargetPath(message.url), type: message.type },
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload,
          { TTL: 60 * 60, urgency: 'high' }
        )
        return { ok: true as const, employeeId: sub.employeeId }
      } catch (error: any) {
        const expired = error?.statusCode === 404 || error?.statusCode === 410
        return { ok: false as const, employeeId: sub.employeeId, expired }
      }
    })
  )

  const outcomes = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { ok: false as const, employeeId: 'unknown', expired: false }
  )

  return {
    sent: outcomes.filter((o) => o.ok).length,
    failed: outcomes.filter((o) => !o.ok).length,
    expiredEmployees: outcomes.filter((o) => !o.ok && o.expired).map((o) => o.employeeId),
  }
}
