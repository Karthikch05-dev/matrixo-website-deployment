'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FaSpinner, FaLock } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import EmployeeConsole from './EmployeeConsole'

export default function ManageClient() {
  const { user, loading } = useAuth()
  const [isEmployee, setIsEmployee] = useState<boolean | null>(null)

  const getIdToken = useCallback(async () => user?.getIdToken(), [user])

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!user) {
        setIsEmployee(false)
        return
      }
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/studentvault/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!cancelled) setIsEmployee(data.isEmployee === true)
      } catch {
        if (!cancelled) setIsEmployee(false)
      }
    }

    if (!loading) check()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (loading || isEmployee === null) {
    return (
      <div className="flex justify-center py-20" aria-live="polite">
        <FaSpinner className="animate-spin text-3xl text-blue-500" />
        <span className="sr-only">Checking your access…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto">
        <FaLock className="mx-auto mb-3 text-2xl text-gray-400 dark:text-gray-500" aria-hidden="true" />
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Sign in required</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Sign in with your matriXO employee account to manage the catalog.
        </p>
        <Link
          href="/auth?returnUrl=/studentvault/manage"
          className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
      </div>
    )
  }

  if (!isEmployee) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-8 text-center max-w-lg mx-auto">
        <FaLock className="mx-auto mb-3 text-2xl text-red-500 dark:text-red-400" aria-hidden="true" />
        <h2 className="font-semibold text-red-700 dark:text-red-300 mb-1">Not authorized</h2>
        <p className="text-sm text-red-600 dark:text-red-200/80 mb-4">
          Catalog management is limited to matriXO employees. You are signed in as{' '}
          {user.email}.
        </p>
        <Link
          href="/studentvault"
          className="inline-flex rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white hover:bg-white dark:hover:bg-white/20"
        >
          Back to StudentVault
        </Link>
      </div>
    )
  }

  return <EmployeeConsole getIdToken={getIdToken} />
}
