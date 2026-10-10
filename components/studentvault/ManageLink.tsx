'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { useAuth } from '@/lib/AuthContext'

/**
 * Shows a "Manage offers" shortcut to matriXO employees. Purely a convenience
 * entry point — the server authorizes every write independently, so a user who
 * forces this to render still cannot change anything.
 */
export default function ManageLink() {
  const { user, loading } = useAuth()
  const [isEmployee, setIsEmployee] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/studentvault/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!cancelled) setIsEmployee(data.isEmployee === true)
      } catch {
        // Ignore — the link simply stays hidden.
      }
    }

    if (!loading) check()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (!isEmployee) return null

  return (
    <ButtonLink href="/studentvault/manage" variant="ghost" size="sm" leadingIcon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}>
      Manage StudentVault
    </ButtonLink>
  )
}
