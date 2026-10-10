'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import OnboardingGate from '@/components/profile/OnboardingGate'
import GoogleOneTap from '@/components/auth/GoogleOneTap'
import BetaBanner from '@/components/BetaBanner'

/**
 * Wraps every page in the public header and footer, except the employee
 * portal, which has its own chrome. Deciding this from the pathname (instead
 * of request headers in the root layout) lets pages render statically.
 */
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode
  footer: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname() || '/'

  if (pathname.startsWith('/employee-portal')) {
    return (
      <main id="main" className="min-h-screen overflow-x-hidden">
        {children}
      </main>
    )
  }

  return (
    <>
      {header}
      <main id="main" className="min-h-[60vh] pt-[var(--nav-height)]">
        <BetaBanner />
        {children}
      </main>
      {footer}
      <OnboardingGate />
      <GoogleOneTap />
    </>
  )
}
