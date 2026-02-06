'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { FaSpinner } from 'react-icons/fa'

// Routes that don't require profile setup
const PUBLIC_ROUTES = [
  '/auth',
  '/profile/setup',
  '/terms',
  '/privacy',
  '/refund',
  '/shipping',
  '/employee-portal',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { profileExists, loading: profileLoading } = useProfile()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while still loading
    if (authLoading || profileLoading) return

    // If user is logged in, profile doesn't exist, and not on a public route
    if (user && !profileExists && !isPublicRoute(pathname)) {
      router.replace('/profile/setup')
    }
  }, [user, profileExists, authLoading, profileLoading, pathname, router])

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

  // If user is logged in but has no profile, block non-public routes
  if (user && !profileLoading && !profileExists && !isPublicRoute(pathname)) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
}
