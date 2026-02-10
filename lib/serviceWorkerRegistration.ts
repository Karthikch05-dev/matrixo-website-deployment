/**
 * Service Worker Registration + Web Push Subscription
 * Registers the service worker and subscribes to push notifications
 */

import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebaseConfig'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

/**
 * Convert a URL-safe base64 string to a Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Register service worker and return the registration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('[SW] Service Worker registered:', registration)

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready
    console.log('[SW] Service Worker is ready')

    return registration
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error)
    return null
  }
}

/**
 * Subscribe to Web Push and store the subscription in Firestore
 * This is what enables notifications even when the browser tab is closed
 */
export async function subscribeToPush(employeeId: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Push notifications not supported')
    return null
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VAPID public key is not configured')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      console.log('[Push] Existing push subscription found')
    } else {
      // Subscribe to push
      console.log('[Push] Creating new push subscription...')
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
      })
      console.log('[Push] Push subscription created')
    }

    // Store subscription in Firestore under pushSubscriptions/{employeeId}_{uniqueHash}
    // Use a unique key per device so one user can have multiple devices
    const subJson = subscription.toJSON()
    const deviceHash = btoa(subJson.endpoint || '').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')
    const docId = `${employeeId}_${deviceHash}`

    await setDoc(doc(db, 'pushSubscriptions', docId), {
      employeeId,
      subscription: subJson,
      endpoint: subJson.endpoint,
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent
    })

    console.log('[Push] Subscription stored in Firestore:', docId)
    return subscription

  } catch (error: any) {
    console.error('[Push] Failed to subscribe to push:', error)
    
    // If user denied permission
    if (error?.name === 'NotAllowedError') {
      console.warn('[Push] User denied notification permission')
    }
    
    return null
  }
}

/**
 * Unsubscribe from push notifications and remove from Firestore
 */
export async function unsubscribeFromPush(employeeId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const subJson = subscription.toJSON()
      const deviceHash = btoa(subJson.endpoint || '').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')
      const docId = `${employeeId}_${deviceHash}`

      await subscription.unsubscribe()
      await deleteDoc(doc(db, 'pushSubscriptions', docId))
      console.log('[Push] Unsubscribed and removed from Firestore')
    }

    return true
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error)
    return false
  }
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve(false)
  }

  return navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      return registration.unregister()
    }
    return false
  })
}
