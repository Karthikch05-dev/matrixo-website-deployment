'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { FlaskConical, X } from 'lucide-react'
import { BETA_PRODUCTS_ENABLED, SITE } from '@/lib/site'

const DISMISS_KEY = 'mx-beta-notice-dismissed-at'
const DISMISS_DAYS = 14

/**
 * Beta-only notice under the navbar: says this is the testing site and offers
 * a one-click feedback email. Rendered on the server (no layout shift for new
 * visitors); dismissing hides it for two weeks.
 */
export default function BetaBanner() {
  const pathname = usePathname() || '/'
  const [hidden, setHidden] = useState(false)
  const [href, setHref] = useState(`mailto:${SITE.email}?subject=${encodeURIComponent('Beta feedback')}`)

  useEffect(() => {
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (at && Date.now() - at < DISMISS_DAYS * 86_400_000) setHidden(true)
    } catch {}
  }, [])

  // Include the page they were on so feedback is actionable.
  useEffect(() => {
    const body = `Page: ${window.location.href}\nDevice: ${navigator.userAgent}\n\nWhat happened / what would you change?\n`
    setHref(`mailto:${SITE.email}?subject=${encodeURIComponent('Beta feedback')}&body=${encodeURIComponent(body)}`)
  }, [pathname])

  if (!BETA_PRODUCTS_ENABLED || hidden || pathname.startsWith('/employee-portal')) return null

  return (
    <div data-beta-banner="true" className="border-b border-accent/15 bg-accent-soft">
      <div className="mx-auto flex max-w-site items-center gap-3 px-4 py-2.5 text-[13px] sm:px-6 lg:px-8">
        <FlaskConical className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-ink">
          <span className="font-semibold">You’re on the matriXO beta.</span>{' '}
          <span className="text-muted">New features land here first and may change or break.</span>{' '}
          <a href={href} className="font-medium text-accent underline-offset-2 hover:underline">
            Send feedback
          </a>
        </p>
        <button
          type="button"
          aria-label="Hide beta notice"
          onClick={() => {
            setHidden(true)
            try {
              localStorage.setItem(DISMISS_KEY, String(Date.now()))
            } catch {}
          }}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
