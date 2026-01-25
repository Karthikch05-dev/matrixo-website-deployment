/**
 * Service Worker Registration
 * Registers the service worker for push notifications
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

    console.log('Service Worker registered:', registration)

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready

    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
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
