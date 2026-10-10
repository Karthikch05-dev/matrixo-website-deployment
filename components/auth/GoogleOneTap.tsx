'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Pages where a floating prompt would get in the way.
const SKIP = ['/auth', '/login', '/register', '/forgot-password', '/employee-portal']

interface GoogleId {
  initialize: (config: Record<string, unknown>) => void
  prompt: () => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } }
  }
}

let scriptPromise: Promise<void> | null = null

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('gsi failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Google One Tap for signed-out visitors. The script loads only after the
 * page is idle (or on first interaction), so it never competes with the
 * first paint. Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID; without it, nothing loads.
 */
export default function GoogleOneTap() {
  const { user, loading, signInWithGoogleIdToken } = useAuth()
  const pathname = usePathname() || '/'
  const skip = SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    if (!CLIENT_ID || loading || user || skip) return
    let cancelled = false
    let started = false

    const start = async () => {
      if (started || cancelled) return
      started = true
      try {
        await loadGsi()
        const id = window.google?.accounts?.id
        if (!id || cancelled) return
        id.initialize({
          client_id: CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return
            try {
              await signInWithGoogleIdToken(response.credential)
              toast.success('Signed in with Google')
            } catch {
              toast.error('Google sign-in didn’t finish. Try the Sign in button.')
            }
          },
        })
        id.prompt()
      } catch {
        // Blocked by an extension or offline — the normal button still works.
      }
    }

    const events = ['pointerdown', 'keydown', 'scroll'] as const
    const onInteract = () => start()
    events.forEach((e) => window.addEventListener(e, onInteract, { once: true, passive: true }))
    const idle = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined
    const timer = window.setTimeout(() => (idle ? idle(start, { timeout: 2000 }) : start()), 3500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, onInteract))
      window.google?.accounts?.id?.cancel()
    }
  }, [loading, user, skip, signInWithGoogleIdToken])

  return null
}
