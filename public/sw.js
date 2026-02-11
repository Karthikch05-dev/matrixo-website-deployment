// Service Worker for Web Push Notifications
// This file handles background push notifications for the Employee Portal

/* eslint-disable no-restricted-globals */

// Service worker event listeners
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(self.clients.claim())
})

// Handle push notifications — THIS is what fires even when the tab is closed
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event)

  let notificationData = {
    title: 'matriXO Portal',
    body: 'You have a new notification',
    icon: '/logos/logo-dark.png',
    badge: '/logos/logo-dark.png',
    tag: 'employee-portal-notification',
    data: {
      url: '/employee-portal'
    }
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: {
          url: (data.data && data.data.url) || notificationData.data.url,
          ...(data.data || {})
        }
      }
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error)
      // Try as text
      try {
        notificationData.body = event.data.text()
      } catch (e) {
        // ignore
      }
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Open Portal' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }
  )

  event.waitUntil(promiseChain)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action)

  event.notification.close()

  // If user clicked dismiss, just close
  if (event.action === 'dismiss') return

  const urlToOpen = event.notification.data?.url || '/employee-portal'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the portal
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes('/employee-portal') && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed')
})

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
