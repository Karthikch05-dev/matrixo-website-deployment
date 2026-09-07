'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { doc, deleteDoc, getDocs, collection, setDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { FaSpinner, FaLock, FaTrash } from 'react-icons/fa'
import { db } from '@/lib/firebaseConfig'
import { useAuth } from '@/lib/AuthContext'
import type { ClaimStatus, Offer } from '@/lib/studentvault/types'
import { CLAIM_STATUSES, daysUntil } from '@/lib/studentvault/types'

interface TrackedItem {
  offerSlug: string
  status: ClaimStatus
  notes: string
  renewBy: string | null
  claimedAt: string | null
}

const FILTERS = ['All', 'Todo', 'Claimed', 'Rejected', 'Expired', 'Expiring'] as const
type Filter = (typeof FILTERS)[number]

export default function TrackerClient({ offers }: { offers: Offer[] }) {
  const { user, loading } = useAuth()
  const [items, setItems] = useState<TrackedItem[]>([])
  const [busy, setBusy] = useState(true)
  const [locked, setLocked] = useState(false)
  const [filter, setFilter] = useState<Filter>('All')
  const [adding, setAdding] = useState('')

  const offerBySlug = useMemo(
    () => new Map(offers.map((o) => [o.slug, o])),
    [offers]
  )

  const load = useCallback(async () => {
    if (!user) {
      setBusy(false)
      return
    }
    try {
      const token = await user.getIdToken()
      const gate = await fetch('/api/studentvault/purchase', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const gateData = await gate.json()
      if (!gateData.active) {
        setLocked(true)
        return
      }

      const snap = await getDocs(
        collection(db, 'studentvault_claims', user.uid, 'items')
      )
      setItems(
        snap.docs.map((d) => {
          const raw = d.data()
          return {
            offerSlug: raw.offerSlug ?? d.id,
            status: (raw.status ?? 'todo') as ClaimStatus,
            notes: raw.notes ?? '',
            renewBy: raw.renewBy ?? null,
            claimedAt: raw.claimedAt ?? null,
          }
        })
      )
    } catch {
      toast.error('Could not load your tracker.')
    } finally {
      setBusy(false)
    }
  }, [user])

  useEffect(() => {
    if (!loading) load()
  }, [loading, load])

  const save = async (item: TrackedItem) => {
    if (!user) return
    try {
      await setDoc(
        doc(db, 'studentvault_claims', user.uid, 'items', item.offerSlug),
        {
          ...item,
          claimedAt:
            item.status === 'claimed'
              ? item.claimedAt || new Date().toISOString()
              : null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      setItems((prev) =>
        prev.some((p) => p.offerSlug === item.offerSlug)
          ? prev.map((p) => (p.offerSlug === item.offerSlug ? item : p))
          : [...prev, item]
      )
    } catch {
      toast.error('Could not save. Please try again.')
    }
  }

  const remove = async (slug: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'studentvault_claims', user.uid, 'items', slug))
      setItems((prev) => prev.filter((p) => p.offerSlug !== slug))
    } catch {
      toast.error('Could not remove that item.')
    }
  }

  const filtered = items.filter((item) => {
    if (filter === 'All') return true
    if (filter === 'Expiring') {
      const offer = offerBySlug.get(item.offerSlug)
      const d = daysUntil(offer?.expiresOn ?? null)
      return d !== null && d >= 0 && d <= 30
    }
    return item.status === filter.toLowerCase()
  })

  const untracked = offers.filter(
    (o) => !items.some((i) => i.offerSlug === o.slug) && o.status !== 'ended'
  )

  if (loading || busy) {
    return (
      <div className="flex justify-center py-20" aria-live="polite">
        <FaSpinner className="animate-spin text-3xl text-blue-600 dark:text-blue-400" />
        <span className="sr-only">Loading your tracker…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="glass-card p-10 text-center max-w-lg mx-auto">
        <FaLock className="mx-auto text-3xl text-gray-400 mb-4" aria-hidden="true" />
        <h2 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
          Sign in to see your tracker
        </h2>
        <Link href="/auth?returnUrl=/studentvault/tracker" className="btn-primary inline-flex">
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
          Your tracker is locked
        </h2>
        <Link href="/studentvault/unlock" className="btn-primary inline-flex mt-2">
          Unlock StudentVault
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter claims">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full px-4 py-2 text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {untracked.length > 0 && (
        <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-3">
          <label htmlFor="sv-add" className="text-sm text-gray-700 dark:text-gray-300">
            Track an offer
          </label>
          <select
            id="sv-add"
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            className="glass-input rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white flex-1 min-w-[12rem]"
          >
            <option value="">Choose an offer…</option>
            {untracked.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!adding}
            onClick={() => {
              save({
                offerSlug: adding,
                status: 'todo',
                notes: '',
                renewBy: null,
                claimedAt: null,
              })
              setAdding('')
            }}
            className="btn-primary text-sm disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {items.length === 0
              ? 'Nothing tracked yet. Add an offer above to start.'
              : 'No items match this filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const offer = offerBySlug.get(item.offerSlug)
            return (
              <li key={item.offerSlug} className="glass-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <Link
                      href={`/studentvault/${item.offerSlug}`}
                      className="font-medium text-gray-900 dark:text-white hover:underline"
                    >
                      {offer?.name ?? item.offerSlug}
                    </Link>
                    {offer && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {offer.category}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`status-${item.offerSlug}`}>
                      Status for {offer?.name ?? item.offerSlug}
                    </label>
                    <select
                      id={`status-${item.offerSlug}`}
                      value={item.status}
                      onChange={(e) =>
                        save({ ...item, status: e.target.value as ClaimStatus })
                      }
                      className="glass-input rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white"
                    >
                      {CLAIM_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(item.offerSlug)}
                      aria-label={`Remove ${offer?.name ?? item.offerSlug} from tracker`}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>

                <label className="sr-only" htmlFor={`notes-${item.offerSlug}`}>
                  Notes
                </label>
                <textarea
                  id={`notes-${item.offerSlug}`}
                  defaultValue={item.notes}
                  onBlur={(e) => {
                    if (e.target.value !== item.notes) {
                      save({ ...item, notes: e.target.value })
                    }
                  }}
                  rows={2}
                  placeholder="Notes — renewal date, rejection reason, which email you used…"
                  className="glass-input w-full rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
