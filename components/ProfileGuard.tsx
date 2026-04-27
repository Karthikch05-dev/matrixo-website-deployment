'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { FaSpinner } from 'react-icons/fa'

// Routes that don't require profile setup
const PUBLIC_ROUTES = [
  '/',
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
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
          <div className="flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-3xl text-purple-500" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      )
    }
  }

  // If user is logged in but has no profile, show redirect UI instead of a blank screen
  if (needsProfileRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-3xl text-purple-500" />
          <p className="text-gray-600 dark:text-gray-300 text-sm">Redirecting to profile setup...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
