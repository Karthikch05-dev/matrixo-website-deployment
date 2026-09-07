'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaSpinner, FaLock, FaExclamationTriangle } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import type { ClaimItem, Offer } from '@/lib/studentvault/types'
import { daysUntil } from '@/lib/studentvault/types'
import type { PlaybookSection, SprintStep } from '@/lib/studentvault/playbook'

interface VaultData {
  playbook: PlaybookSection[]
  sprint: SprintStep[]
  claims: ClaimItem[]
}

type Tab = 'overview' | 'sprint' | 'playbook' | 'radar' | 'autocharge'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sprint', label: '90-Minute Sprint' },
  { id: 'playbook', label: 'Verification Playbook' },
  { id: 'radar', label: 'Deadline Radar' },
  { id: 'autocharge', label: 'Auto-charge Guard' },
]

export default function VaultClient({ offers }: { offers: Offer[] }) {
  const { user, loading } = useAuth()
  const [data, setData] = useState<VaultData | null>(null)
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        setBusy(false)
        return
      }
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/studentvault/vault', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const payload = await res.json()

        if (cancelled) return

        if (res.status === 403) {
          setLocked(true)
        } else if (!res.ok) {
          setError(payload.error || 'Could not load your vault.')
        } else {
          setData(payload)
        }
      } catch {
        if (!cancelled) setError('Could not reach the server. Check your connection.')
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
      <div className="flex justify-center py-20" aria-live="polite">
        <FaSpinner className="animate-spin text-3xl text-blue-600 dark:text-blue-400" />
        <span className="sr-only">Loading your vault…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="glass-card p-10 text-center max-w-lg mx-auto">
        <FaLock className="mx-auto text-3xl text-gray-400 mb-4" aria-hidden="true" />
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
          Sign in to open your Vault
        </h2>
        <Link
          href="/auth?returnUrl=/studentvault/vault"
          className="btn-primary inline-flex mt-4"
        >
          Sign in
        </Link>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="glass-card p-10 text-center max-w-lg mx-auto">
        <FaLock className="mx-auto text-3xl text-gray-400 mb-4" aria-hidden="true" />
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
          Your Vault is locked
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Unlock StudentVault to get the claim walkthroughs, verification playbook,
          deadline radar and your tracker.
        </p>
        <Link href="/studentvault/unlock" className="btn-primary inline-flex">
          Unlock StudentVault
        </Link>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error || 'Could not load your vault.'}
        </p>
      </div>
    )
  }

  const claimedSlugs = new Set(
    data.claims.filter((c) => c.status === 'claimed').map((c) => c.offerSlug)
  )
  const claimedValue = offers
    .filter((o) => claimedSlugs.has(o.slug))
    .reduce((sum, o) => sum + (o.valueInr || 0), 0)

  const deadlineOffers = offers
    .filter((o) => o.expiresOn && o.status !== 'ended')
    .map((o) => ({ offer: o, days: daysUntil(o.expiresOn) ?? 9999 }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)

  const cardOffers = offers.filter((o) => o.requiresCard && o.status !== 'ended')

  return (
    <div>
      <div
        className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-3"
        role="tablist"
        aria-label="Vault sections"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="glass-card p-5">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {claimedSlugs.size}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Offers claimed</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ≈ ₹{claimedValue.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Value claimed</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {deadlineOffers.filter((d) => d.days <= 30).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Deadlines within 30 days
            </p>
          </div>
          <div className="sm:col-span-3">
            <Link href="/studentvault/tracker" className="btn-secondary inline-flex">
              Open my tracker
            </Link>
          </div>
        </div>
      )}

      {tab === 'sprint' && (
        <ol className="space-y-4">
          {data.sprint.map((step) => (
            <li key={step.order} className="glass-card p-5">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center text-sm font-semibold">
                  {step.order}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {step.title}{' '}
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      · {step.minutes} min
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {tab === 'playbook' && (
        <div className="space-y-4">
          {data.playbook.map((section) => (
            <section key={section.title} className="glass-card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {section.body}
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
                {section.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {tab === 'radar' && (
        <div className="space-y-3">
          {deadlineOffers.length === 0 ? (
            <div className="glass-card p-8 text-center text-sm text-gray-600 dark:text-gray-400">
              No offers with upcoming deadlines right now.
            </div>
          ) : (
            deadlineOffers.map(({ offer, days }) => (
              <Link
                key={offer.id}
                href={`/studentvault/${offer.slug}`}
                className="glass-card p-4 flex items-center justify-between gap-4 hover-lift"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {offer.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {offer.category}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold whitespace-nowrap ${
                    days <= 7
                      ? 'text-red-600 dark:text-red-400'
                      : days <= 30
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`}
                </span>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'autocharge' && (
        <div className="space-y-3">
          <div className="glass-card p-5 border-l-4 border-l-amber-500">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2">
              <FaExclamationTriangle
                className="text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              Offers that need a payment method
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              These offers ask for a card. Set a reminder before each renewal date —
              this is where students most often lose real money.
            </p>
          </div>
          {cardOffers.length === 0 ? (
            <div className="glass-card p-8 text-center text-sm text-gray-600 dark:text-gray-400">
              None of the current offers require a card.
            </div>
          ) : (
            cardOffers.map((offer) => (
              <Link
                key={offer.id}
                href={`/studentvault/${offer.slug}`}
                className="glass-card p-4 block hover-lift"
              >
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  {offer.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {offer.autoChargeNote || 'Check the provider’s renewal terms.'}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
