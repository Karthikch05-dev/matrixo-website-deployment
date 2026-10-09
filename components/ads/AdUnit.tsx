'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ADSENSE_CLIENT } from '@/lib/adsense'

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

type AdUnitProps = {
  /** 10-digit ad unit ID from AdSense -> Ads -> By ad unit. Omit to render nothing. */
  slot?: string
  /** 'auto' adapts to the container; 'fluid' is for in-feed units. */
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
  /** Required by AdSense for in-feed ('fluid') units. */
  layoutKey?: string
  /** Allow the unit to go full-bleed on mobile. */
  responsive?: boolean
  className?: string
  /** Height held open while the ad loads, so filling it shifts nothing. */
  minHeight?: number
}

/**
 * A single AdSense unit.
 *
 * Three things that break AdSense inside a Next.js App Router app, handled here:
 *
 *  1. Pushing the same <ins> twice throws "All 'ins' elements already have ads
 *     in them". React StrictMode runs effects twice in dev, and re-renders can
 *     re-fire the effect, so we check Google's own status attribute first.
 *  2. Client-side navigation doesn't reload the page, so a unit mounted after a
 *     route change never initialises unless we push again - hence the pathname
 *     dependency.
 *  3. An unfilled slot leaves a blank gap. Google stamps data-ad-status, so we
 *     watch it and collapse the container when there's nothing to show.
 */
export default function AdUnit({
  slot,
  format = 'auto',
  layoutKey,
  responsive = true,
  className = '',
  minHeight = 280,
}: AdUnitProps) {
  const insRef = useRef<HTMLModElement | null>(null)
  const pathname = usePathname()
  const [unfilled, setUnfilled] = useState(false)

  useEffect(() => {
    const el = insRef.current
    if (!el || !slot) return

    // Already initialised by AdSense - pushing again would throw.
    if (el.getAttribute('data-adsbygoogle-status')) return

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Loader blocked (ad blocker / offline). Leave the slot collapsed.
    }

    const observer = new MutationObserver(() => {
      if (el.getAttribute('data-ad-status') === 'unfilled') setUnfilled(true)
    })
    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] })
    return () => observer.disconnect()
  }, [pathname, slot])

  // No slot configured, or Google had nothing to serve: render nothing, so the
  // page is byte-identical to how it looks without ads.
  if (!slot || unfilled) return null

  return (
    <div className={className}>
      <span className="block text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}
