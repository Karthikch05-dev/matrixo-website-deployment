import { NextRequest, NextResponse } from 'next/server'
import webPush from 'web-push'

export const dynamic = 'force-dynamic'

// Configure VAPID details
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = 'mailto:admin@matrixo.in'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    url?: string
    type?: string
    [key: string]: any
  }
}

interface SubscriptionDoc {
  employeeId: string
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }
  endpoint: string
}

/**
 * POST /api/push/send
 * 
 * Sends push notifications to specified employee subscriptions.
 * Called internally by the notification creation flow.
 * 
 * Body: {
 *   subscriptions: SubscriptionDoc[]  - Array of push subscription docs from Firestore
 *   payload: PushPayload              - The notification content
 * }
 */
export async function POST(request: NextRequest) {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { subscriptions, payload } = body as {
      subscriptions: SubscriptionDoc[]
      payload: PushPayload
    }

    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions provided' },
        { status: 400 }
      )
    }

    if (!payload || !payload.title) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // Prepare the push payload
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      icon: payload.icon || '/logos/logo-dark.png',
      badge: payload.badge || '/logos/logo-dark.png',
      tag: payload.tag || `notification-${Date.now()}`,
      data: {
        url: payload.data?.url || '/employee-portal',
        ...payload.data
      }
    })

    const pushOptions: webPush.RequestOptions = {
      TTL: 60 * 60, // 1 hour TTL
      urgency: 'high' as const
    }

    // Send to all subscriptions, track results
    const results = await Promise.allSettled(
      subscriptions.map(async (subDoc) => {
        const pushSubscription = {
          endpoint: subDoc.subscription.endpoint,
          keys: subDoc.subscription.keys
        }

        try {
          await webPush.sendNotification(pushSubscription, pushPayload, pushOptions)
          return { success: true, employeeId: subDoc.employeeId }
        } catch (error: any) {
          // 410 Gone or 404 means subscription is expired/invalid
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            console.log(`[Push] Subscription expired for ${subDoc.employeeId}, should be cleaned up`)
            return { success: false, employeeId: subDoc.employeeId, expired: true, error: error?.message }
          }
          console.error(`[Push] Failed to send to ${subDoc.employeeId}:`, error?.message)
          return { success: false, employeeId: subDoc.employeeId, error: error?.message }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length
    const failed = results.length - successful
    const expired = results.filter(r => r.status === 'fulfilled' && (r.value as any).expired).length

    // Collect expired subscription doc IDs for cleanup
    const expiredEmployees = results
      .filter(r => r.status === 'fulfilled' && (r.value as any).expired)
      .map(r => (r as PromiseFulfilledResult<any>).value.employeeId)

    console.log(`[Push] Sent: ${successful}, Failed: ${failed}, Expired: ${expired}`)

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      expired,
      expiredEmployees
    })

  } catch (error: any) {
    console.error('[Push API] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
