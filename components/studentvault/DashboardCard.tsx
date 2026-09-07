'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaSpinner, FaVault } from 'react-icons/fa6'
import { useAuth } from '@/lib/AuthContext'

interface Summary {
  active: boolean
  offerCount: number
  totalValue: number
  claimedCount: number
  claimedValue: number
  nextExpiring: { name: string; slug: string; days: number } | null
}

export default function StudentVaultDashboardCard() {
  const { user, loading } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        setBusy(false)
        return
      }
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/studentvault/summary', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok && !cancelled) setSummary(await res.json())
      } catch {
        // Non-fatal — the card simply stays hidden.
      } finally {
        if (!cancelled) setBusy(false)
      }
    }

    if (!loading) load()
    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (loading || busy) {
    return (
      <div className="p-5 rounded-2xl bg-white/5 dark:bg-white/[0.06] border border-white/[0.08] flex justify-center">
        <FaSpinner className="animate-spin text-blue-500" aria-hidden="true" />
        <span className="sr-only">Loading StudentVault summary…</span>
      </div>
    )
  }

  if (!summary) return null

  return (
    <section
      aria-labelledby="sv-card-heading"
      className="p-5 rounded-2xl bg-white/5 dark:bg-white/[0.06] border border-white/[0.08]"
    >
      <div className="flex items-center gap-2 mb-3">
        <FaVault className="text-blue-500" aria-hidden="true" />
        <h3
          id="sv-card-heading"
          className="font-semibold text-gray-900 dark:text-white"
        >
          StudentVault
        </h3>
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${
            summary.active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
          }`}
        >
          {summary.active ? 'Active' : 'Locked'}
        </span>
      </div>

      {summary.active ? (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.claimedCount}
              </p>
              <p className="text-xs text-gray-500">Offers claimed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ≈ ₹{summary.claimedValue.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500">Value claimed</p>
            </div>
          </div>

          {summary.nextExpiring && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Next deadline:{' '}
              <Link
                href={`/studentvault/${summary.nextExpiring.slug}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {summary.nextExpiring.name}
              </Link>{' '}
              — {summary.nextExpiring.days} day
              {summary.nextExpiring.days === 1 ? '' : 's'} left
            </p>
          )}

          <Link
            href="/studentvault/vault"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center"
          >
            Open StudentVault
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {summary.offerCount} verified student offers worth about ₹
            {summary.totalValue.toLocaleString('en-IN')} are listed free. Unlock the
            claim guides, deadline alerts and your tracker.
          </p>
          <div className="flex gap-2">
            <Link
              href="/studentvault"
              className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-white/5 transition-all text-center"
            >
              Browse free
            </Link>
            <Link
              href="/studentvault/unlock"
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-blue-400 transition-all text-center"
            >
              Unlock
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
