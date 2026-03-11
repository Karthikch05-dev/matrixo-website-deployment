/**
 * Push Notification Utilities
 * Handles browser push notifications (Web Push API)
 */

// ============================================
// REQUEST NOTIFICATION PERMISSION
// ============================================

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

// ============================================
// SEND BROWSER NOTIFICATION
// ============================================

export function sendBrowserNotification(
  title: string,
  body: string,
  icon?: string,
  targetUrl?: string
): void {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/logos/logo-dark.png',
      badge: '/logos/logo-dark.png',
      tag: 'employee-portal-notification',
      requireInteraction: false,
      silent: false
    })

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault()
      window.focus()
      
      if (targetUrl) {
        window.location.href = targetUrl
      }
      
      notification.close()
    }

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)
  } catch (error) {
    console.error('Error showing browser notification:', error)
  }
}

// ============================================
// CHECK NOTIFICATION SUPPORT
// ============================================

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

// ============================================
// GET NOTIFICATION PERMISSION STATUS
// ============================================

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied'
  }
  return Notification.permission
}
