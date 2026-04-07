'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaSpinner } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/auth?returnUrl=/dashboard')
      return
    }

    // Existing authenticated user dashboard experience lives on /profile.
    router.replace('/profile')
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-black flex items-center justify-center">
      <FaSpinner className="animate-spin text-4xl text-blue-500" />
    </div>
  )
}
