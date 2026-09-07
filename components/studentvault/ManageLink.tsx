'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaUserShield } from 'react-icons/fa'
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
    <Link
      href="/studentvault/manage"
      className="btn-secondary inline-flex items-center gap-2"
    >
      <FaUserShield className="text-sm" aria-hidden="true" />
      Manage offers
    </Link>
  )
}
