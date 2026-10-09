/**
 * Public Notifications — Server-side utilities
 *
 * Creates and queries global, public-facing notifications stored in the
 * `publicNotifications` Firestore collection. These are NOT tied to any user
 * account and are readable by anyone (visitors + logged-in users alike).
 *
 * All writes go through the Firebase Admin SDK — client writes are denied by
 * Firestore rules.
 */

import { getAdminFirestore } from '@/lib/firebaseAdmin'

// ════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════

export const PUBLIC_NOTIFICATIONS_COLLECTION = 'publicNotifications'
export const READ_STATE_COLLECTION = 'publicNotificationReadState'

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

export type NotificationType =
  | 'EVENT_NEW'
  | 'EVENT_UPDATED'
  | 'STUDENTVAULT_OFFER'
  | 'NEW_EVENT'
  | 'NEW_HACKATHON'
  | 'NEW_BOOTCAMP'
  | 'NEW_WORKSHOP'
  | 'NEW_OFFER'
  | 'ANNOUNCEMENT'

export type NotificationCategory = 'EVENTS' | 'STUDENTVAULT' | 'PLATFORM'

export interface PublicNotification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  targetUrl: string
  source: string
  sourceId: string
  version?: string
  audience: 'PUBLIC'
  isActive: boolean
  expiresAt: string | null
  publishedAt: string
  createdAt: string
}

export interface CreatePublicNotificationParams {
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  targetUrl: string
  source: string
  sourceId: string
  version?: string
  expiresAt?: Date | null
}

export interface GetNotificationsOptions {
  limit?: number
  category?: NotificationCategory
  afterId?: string
}

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

function toIsoSafe(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  const maybe = value as { toDate?: () => Date }
  if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return null
}

function normalizeNotification(
  id: string,
  raw: Record<string, unknown>
): PublicNotification {
  return {
    id,
    type: (raw.type as NotificationType) ?? 'ANNOUNCEMENT',
    category: (raw.category as NotificationCategory) ?? 'PLATFORM',
    title: (raw.title as string) ?? '',
    message: (raw.message as string) ?? '',
    targetUrl: (raw.targetUrl as string) ?? '',
    source: (raw.source as string) ?? (raw.entityType as string) ?? '',
    sourceId: (raw.sourceId as string) ?? (raw.entityId as string) ?? '',
    version: raw.version as string | undefined,
    audience: 'PUBLIC',
    isActive: raw.isActive !== false,
    expiresAt: toIsoSafe(raw.expiresAt),
    publishedAt: toIsoSafe(raw.publishedAt) ?? '',
    createdAt: toIsoSafe(raw.createdAt) ?? '',
  }
}

// ════════════════════════════════════════════════════════════════════
// CREATE NOTIFICATION (with duplicate prevention)
// ════════════════════════════════════════════════════════════════════

/**
 * Creates a public notification. If a notification for the same `source` +
 * `sourceId` + `version` (optional) already exists, silently skips creation and returns `null`.
 *
 * This prevents duplicates from retried publishes, re-deployments, or
 * repeated admin actions.
 */
export async function createPublicNotification(
  params: CreatePublicNotificationParams
): Promise<{ id: string } | null> {
  try {
    const firestore = getAdminFirestore()
    const collection = firestore.collection(PUBLIC_NOTIFICATIONS_COLLECTION)

    // ── Duplicate check ──────────────────────────────────────────────
    let existingQuery = collection
      .where('source', '==', params.source)
      .where('sourceId', '==', params.sourceId)
    
    if (params.version !== undefined) {
      existingQuery = existingQuery.where('version', '==', params.version)
    }

    const existing = await existingQuery.limit(1).get()

    if (!existing.empty) {
      console.log(
        `[PublicNotification] Skipping duplicate: ${params.source}/${params.sourceId} (version: ${params.version}) already has a notification`
      )
      return null
    }

    // ── Create ───────────────────────────────────────────────────────
    const now = new Date()
    const doc = await collection.add({
      type: params.type,
      category: params.category,
      title: params.title,
      message: params.message,
      targetUrl: params.targetUrl,
      source: params.source,
      sourceId: params.sourceId,
      version: params.version ?? null,
      audience: 'PUBLIC',
      isActive: true,
      expiresAt: params.expiresAt ?? null,
      publishedAt: now,
      createdAt: now,
    })

    console.log(
      `[PublicNotification] Created: ${params.type} for ${params.source}/${params.sourceId} → ${doc.id}`
    )

    return { id: doc.id }
  } catch (error) {
    console.error('[PublicNotification] Failed to create notification:', error)
    // Non-fatal: a missing notification should not block the publish operation
    return null
  }
}

// ════════════════════════════════════════════════════════════════════
// FETCH ACTIVE PUBLIC NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Fetches active, non-expired public notifications sorted by newest first.
 * Used by the public `GET /api/notifications` endpoint.
 */
export async function getActivePublicNotifications(
  options: GetNotificationsOptions = {}
): Promise<{ notifications: PublicNotification[]; hasMore: boolean }> {
  const maxLimit = 50
  const requestedLimit = Math.min(Math.max(options.limit ?? 20, 1), maxLimit)
  // Fetch one extra to determine hasMore
  const fetchLimit = requestedLimit + 1

  const firestore = getAdminFirestore()
  let query: FirebaseFirestore.Query = firestore
    .collection(PUBLIC_NOTIFICATIONS_COLLECTION)
    .where('isActive', '==', true)
    .orderBy('publishedAt', 'desc')

  if (options.category) {
    query = query.where('category', '==', options.category)
  }

  // Cursor-based pagination: start after a specific document
  if (options.afterId) {
    const cursorDoc = await firestore
      .collection(PUBLIC_NOTIFICATIONS_COLLECTION)
      .doc(options.afterId)
      .get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  query = query.limit(fetchLimit)

  const snap = await query.get()
  const now = new Date()

  const allDocs = snap.docs
    .map((d) => normalizeNotification(d.id, d.data() as Record<string, unknown>))
    .filter((n) => {
      // Exclude expired notifications
      if (n.expiresAt) {
        const expiry = new Date(n.expiresAt)
        if (!Number.isNaN(expiry.getTime()) && expiry < now) return false
      }
      return true
    })

  const hasMore = allDocs.length > requestedLimit
  const notifications = allDocs.slice(0, requestedLimit)

  return { notifications, hasMore }
}

// ════════════════════════════════════════════════════════════════════
// READ STATE (logged-in users)
// ════════════════════════════════════════════════════════════════════

/**
 * Fetches the set of notification IDs that a user has marked as read.
 */
export async function getReadNotificationIds(userId: string): Promise<string[]> {
  try {
    const doc = await getAdminFirestore()
      .collection(READ_STATE_COLLECTION)
      .doc(userId)
      .get()

    if (!doc.exists) return []
    const data = doc.data()
    return Array.isArray(data?.readIds) ? data.readIds : []
  } catch (error) {
    console.error('[PublicNotification] Failed to get read state:', error)
    return []
  }
}

/**
 * Marks one or more notification IDs as read for a user. Uses Firestore
 * arrayUnion so concurrent calls are safe.
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[]
): Promise<boolean> {
  try {
    const { FieldValue } = await import('firebase-admin/firestore')
    await getAdminFirestore()
      .collection(READ_STATE_COLLECTION)
      .doc(userId)
      .set(
        {
          readIds: FieldValue.arrayUnion(...notificationIds),
          updatedAt: new Date(),
        },
        { merge: true }
      )
    return true
  } catch (error) {
    console.error('[PublicNotification] Failed to mark as read:', error)
    return false
  }
}

// ════════════════════════════════════════════════════════════════════
// EVENT CATEGORY MAPPING
// ════════════════════════════════════════════════════════════════════

/**
 * Maps an event's `category` field from events.json to a notification type.
 */
export function mapEventCategoryToNotificationType(
  eventCategory: string
): NotificationType {
  const lower = eventCategory.toLowerCase()

  if (lower.includes('hackathon') || lower.includes('competition')) {
    return 'NEW_HACKATHON'
  }
  if (lower.includes('bootcamp')) {
    return 'NEW_BOOTCAMP'
  }
  if (lower.includes('workshop')) {
    return 'NEW_WORKSHOP'
  }
  // Default fallback for conferences, TEDx, generic events, etc.
  return 'NEW_EVENT'
}
