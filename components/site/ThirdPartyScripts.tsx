'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const GA_ID = 'G-KFF7KV3Z11'
const ADSENSE_CLIENT = 'ca-pub-2402360356645801'

// Ads never load on sign-in, account, checkout or staff pages: they have no
// publisher content (an AdSense policy issue) and ads there hurt trust.
const NO_ADS_PREFIXES = [
  '/auth',
  '/login',
  '/register',
  '/forgot-password',
  '/profile',
  '/dashboard',
  '/notifications',
  '/employee-portal',
  '/careers/admin',
  '/careers/dashboard',
  '/careers/apply',
  '/studentvault/unlock',
  '/studentvault/vault',
  '/studentvault/tracker',
  '/studentvault/manage',
]

const adsAllowed = (pathname: string) =>
  !NO_ADS_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`

type IdleWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
}

function injectScript(src: string, attrs: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return
  const s = document.createElement('script')
  s.src = src
  s.async = true
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v))
  document.head.appendChild(s)
}

/**
 * Analytics and ads, loaded only after the page is interactive.
 *
 * Google Analytics and AdSense together were ~450 KB and ~600 ms of main-thread
 * work during load. They now wait for the first user interaction, or for the
 * browser to go idle after load (with a timeout), whichever comes first, so
 * they never compete with the page's own content. Page views are still
 * recorded, just a moment later.
 *
 * AdSense (including Auto ads) loads on content pages only — see
 * NO_ADS_PREFIXES.
 */
export default function ThirdPartyScripts() {
  const pathname = usePathname()

  useEffect(() => {
    const w = window as IdleWindow
    let fired = false
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

    const load = () => {
      if (fired) return
      fired = true
      events.forEach((e) => window.removeEventListener(e, load))

      w.dataLayer = w.dataLayer || []
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments)
      }
      w.gtag('js', new Date())
      w.gtag('config', GA_ID)
      injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`)

      if (adsAllowed(window.location.pathname)) {
        injectScript(ADSENSE_SRC, { crossorigin: 'anonymous' })
      }
      window.dispatchEvent(new Event('mx:third-party-ready'))
    }

    events.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }))

    const onLoad = () => {
      const delay = () => (w.requestIdleCallback ? w.requestIdleCallback(load, { timeout: 5000 }) : window.setTimeout(load, 3500))
      window.setTimeout(delay, 2500)
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })

    return () => {
      events.forEach((e) => window.removeEventListener(e, load))
      window.removeEventListener('load', onLoad)
    }
  }, [])

  // Client-side navigation from a no-ads page to a content page (GA4's
  // enhanced measurement records the page view itself).
  useEffect(() => {
    const w = window as IdleWindow
    if (w.gtag && adsAllowed(pathname)) injectScript(ADSENSE_SRC, { crossorigin: 'anonymous' })
  }, [pathname])

  return null
}
