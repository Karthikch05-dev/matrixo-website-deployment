'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Sheet from '@/components/ui/Sheet'
import { useProfile } from '@/lib/ProfileContext'
import OnboardingFlow from './OnboardingFlow'

// Never interrupt sign-in, checkout or the team portal.
const QUIET = ['/auth', '/login', '/register', '/forgot-password', '/employee-portal', '/profile/setup', '/studentvault']
const SNOOZE_KEY = 'mx-onboarding-snoozed'

/**
 * Shows the first-run onboarding once, a moment after a brand-new profile is
 * created. No hard gate: closing it keeps everything usable, and the profile
 * page shows a gentle "complete your profile" nudge instead.
 */
export default function OnboardingGate() {
  const { profile } = useProfile()
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const [side, setSide] = useState<'bottom' | 'right'>('bottom')
  const quiet = QUIET.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const pending = profile?.onboardingStatus === 'pending'

  useEffect(() => {
    if (!pending || quiet) return
    try {
      if (sessionStorage.getItem(SNOOZE_KEY)) return
    } catch {}
    setSide(window.matchMedia('(min-width: 640px)').matches ? 'right' : 'bottom')
    const t = window.setTimeout(() => setOpen(true), 900)
    return () => window.clearTimeout(t)
  }, [pending, quiet])

  const close = () => {
    setOpen(false)
    try {
      sessionStorage.setItem(SNOOZE_KEY, '1')
    } catch {}
  }

  if (!pending) return null

  return (
    <Sheet open={open} onClose={close} title="Set up your profile" hideTitle side={side}>
      <div className="h-full p-6 sm:p-8">
        <OnboardingFlow onFinish={() => setOpen(false)} />
      </div>
    </Sheet>
  )
}
