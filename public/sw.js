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

  var rawUrl = (event.notification.data && event.notification.data.url) || '/employee-portal'

  // Validate URL: only allow same-origin paths starting with /employee-portal
  var targetUrl = '/employee-portal' // safe fallback
  try {
    if (rawUrl.startsWith('/')) {
      if (rawUrl.startsWith('/employee-portal') || rawUrl === '/') {
        targetUrl = rawUrl
      }
    } else if (rawUrl.startsWith('http')) {
      var parsed = new URL(rawUrl)
      var swOrigin = self.location.origin
      if (parsed.origin === swOrigin && parsed.pathname.startsWith('/employee-portal')) {
        targetUrl = parsed.pathname + parsed.search + parsed.hash
      }
    }
  } catch (e) {
    console.warn('[Service Worker] Invalid notification URL, using fallback:', rawUrl)
  }

  // Build absolute URL from service worker scope
  var fullUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        var matchingClient = null
        var portalClient = null

        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i]
          // Exact URL match — best case
          if (client.url === fullUrl && 'focus' in client) {
            matchingClient = client
            break
          }
          // Any employee-portal tab
          if (client.url.indexOf('/employee-portal') !== -1 && 'focus' in client) {
            portalClient = client
          }
        }

        // Exact match — focus and notify to refresh
        if (matchingClient) {
          return matchingClient.focus().then(function (focused) {
            focused.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl, timestamp: Date.now() })
            return focused
          })
        }

        // Portal tab on different route — focus, navigate, notify
        if (portalClient) {
          return portalClient.focus().then(function (focused) {
            focused.postMessage({ type: 'NOTIFICATION_NAVIGATE', url: targetUrl, timestamp: Date.now() })
            if ('navigate' in focused) {
              return focused.navigate(fullUrl)
            }
            return focused
          })
        }

        // No portal tab open — open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl)
        }
      })
      .catch(function (err) {
        console.error('[Service Worker] notificationclick error:', err)
        if (self.clients.openWindow) {
          return self.clients.openWindow(new URL('/employee-portal', self.location.origin).href)
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
