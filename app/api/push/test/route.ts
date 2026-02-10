import { NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import webPush from 'web-push'

export const dynamic = 'force-dynamic'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails('mailto:admin@matrixo.in', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

/**
 * GET /api/push/test
 * Sends a test push notification to ALL registered push subscriptions.
 * Uses the client-side Firestore REST API to read subscriptions.
 */
export async function GET() {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
    }

    // Use Firestore REST API to get push subscriptions
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!projectId) {
      return NextResponse.json({ error: 'Firebase project ID not configured' }, { status: 500 })
    }

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pushSubscriptions`
    
    const response = await fetch(firestoreUrl)
    const data = await response.json()

    if (!data.documents || data.documents.length === 0) {
      return NextResponse.json({ 
        error: 'No push subscriptions found. Open the employee portal first to register your device.',
        hint: 'Visit /employee-portal and allow notification permissions. Then try this endpoint again.'
      }, { status: 404 })
    }

    // Parse Firestore documents to get subscription objects
    const subscriptions: any[] = []
    for (const doc of data.documents) {
      const fields = doc.fields
      if (fields?.subscription?.mapValue?.fields) {
        const subFields = fields.subscription.mapValue.fields
        const endpoint = subFields.endpoint?.stringValue
        const keys = subFields.keys?.mapValue?.fields
        const p256dh = keys?.p256dh?.stringValue
        const auth = keys?.auth?.stringValue

        if (endpoint && p256dh && auth) {
          subscriptions.push({
            employeeId: fields.employeeId?.stringValue || 'unknown',
            subscription: { endpoint, keys: { p256dh, auth } }
          })
        }
      }
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        error: 'Found documents but no valid subscriptions. Subscriptions may be malformed.',
        docCount: data.documents.length
      }, { status: 404 })
    }

    // Send test push to all subscriptions
    const payload = JSON.stringify({
      title: '🔔 matriXO Push Test',
      body: 'Push notifications are working! You will receive notifications even when the browser is closed.',
      icon: '/logos/logo-dark.png',
      badge: '/logos/logo-dark.png',
      tag: 'test-notification',
      data: { url: '/employee-portal' }
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            { endpoint: sub.subscription.endpoint, keys: sub.subscription.keys },
            payload,
            { TTL: 3600, urgency: 'high' }
          )
          return { success: true, employeeId: sub.employeeId }
        } catch (err: any) {
          return { success: false, employeeId: sub.employeeId, error: err?.message, statusCode: err?.statusCode }
        }
      })
    )

    const summary = results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'promise rejected' })
    const successCount = summary.filter(s => s.success).length

    return NextResponse.json({
      message: `Test push sent to ${successCount}/${subscriptions.length} devices`,
      results: summary
    })

  } catch (error: any) {
    console.error('[Push Test] Error:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
