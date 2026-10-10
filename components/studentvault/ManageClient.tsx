'use client'

import { useCallback, useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
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
        const res = await fetch('/api/studentvault/me', { headers: { Authorization: `Bearer ${token}` } })
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
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-10 w-80 rounded-full" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <EmptyState
        icon={<Lock className="h-5 w-5" />}
        title="Sign in required"
        description="Sign in with your matriXO team account to manage StudentVault."
        action={<ButtonLink href="/auth?returnUrl=/studentvault/manage">Sign in</ButtonLink>}
        className="rounded-card border border-line bg-surface"
      />
    )
  }

  if (!isEmployee) {
    return (
      <EmptyState
        icon={<Lock className="h-5 w-5" />}
        title="Team members only"
        description={`StudentVault management is limited to the matriXO team. You’re signed in as ${user.email}.`}
        action={<ButtonLink href="/studentvault" variant="secondary">Back to StudentVault</ButtonLink>}
        className="rounded-card border border-line bg-surface"
      />
    )
  }

  return <EmployeeConsole getIdToken={getIdToken} />
}
