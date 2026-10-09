'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import XOLoader from '@/components/XOLoader'

// Routes that don't require profile setup
const PUBLIC_ROUTES = [
  '/',
  '/home',
  '/brand',
  '/login',
  '/register',
  '/forgot-password',
  '/notifications',
  '/studentvault',
  '/about',
  '/team',
  '/services',
  '/events',
  '/contact',
  '/blog',
  '/careers',
  '/auth',
  '/profile/setup',
  '/terms',
  '/privacy',
  '/refund',
  '/data-protection',
  '/employee-portal',
  '/u',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { profileExists, loading: profileLoading } = useProfile()
  const pathname = usePathname()
  const router = useRouter()
  const needsProfileRedirect = Boolean(user && !profileLoading && !profileExists && !isPublicRoute(pathname))

  useEffect(() => {
    if (authLoading || !needsProfileRedirect) return

    router.replace('/profile/setup')

    // Fallback for edge cases where client routing stalls
    const fallbackRedirect = window.setTimeout(() => {
      if (window.location.pathname !== '/profile/setup') {
        window.location.href = '/profile/setup'
      }
    }, 1200)

    return () => {
      window.clearTimeout(fallbackRedirect)
    }
  }, [authLoading, needsProfileRedirect, router])

  // Show loading while checking auth + profile
  if (authLoading || (user && profileLoading)) {
    // Only show loading on non-public routes to avoid flash
    if (!isPublicRoute(pathname)) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center">
          <XOLoader size={20} label="Loading your account" />
        </div>
      )
    }
  }

  // If user is logged in but has no profile, show redirect UI instead of a blank screen
  if (needsProfileRedirect) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <XOLoader size={20} label="Taking you to profile setup" />
      </div>
    )
  }

  return <>{children}</>
}
