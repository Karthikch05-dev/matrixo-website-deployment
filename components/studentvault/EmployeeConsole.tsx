'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FaSpinner, FaLock, FaPlus, FaCheckCircle } from 'react-icons/fa'
import { useEmployeeAuth } from '@/lib/employeePortalContext'
import type { Offer } from '@/lib/studentvault/types'
import { daysUntil } from '@/lib/studentvault/types'
import OfferForm from './OfferForm'

const FILTERS = [
  'All',
  'Needs Verification',
  'Live',
  'Changed',
  'Ended',
  'Expiring Soon',
  'Drafts',
] as const
type Filter = (typeof FILTERS)[number]

const STALE_DAYS = 30

export default function EmployeeConsole() {
  const { user } = useEmployeeAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [busy, setBusy] = useState(true)
  const [denied, setDenied] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')
  const [editing, setEditing] = useState<Offer | null>(null)
  const [creating, setCreating] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)

  const authedFetch = useCallback(
    async (url: string, init: RequestInit = {}) => {
      const token = await user?.getIdToken()
      return fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers || {}),
        },
      })
    },
    [user]
  )

  const load = useCallback(async () => {
    if (!user) {
      setBusy(false)
      return
    }
    setBusy(true)
    try {
      const res = await authedFetch('/api/studentvault/offers')
      const data = await res.json()
      if (res.status === 401 || res.status === 403) {
        setDenied(data.error || 'Not authorized.')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Could not load offers.')
      setDenied(null)
      setOffers(data.offers || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load offers.')
    } finally {
      setBusy(false)
    }
  }, [user, authedFetch])

  useEffect(() => {
    load()
  }, [load])

  const verifyToday = async (offer: Offer) => {
    if (
      !window.confirm(
        `Confirm you have just checked "${offer.name}" against the provider's official source. This updates its Last Verified date.`
      )
    ) {
      return
    }
    setActioning(offer.id)
    try {
      const res = await authedFetch(`/api/studentvault/offers/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'verify' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not verify.')
      toast.success(`${offer.name} marked verified today.`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not verify.')
    } finally {
      setActioning(null)
    }
  }

  const togglePublish = async (offer: Offer) => {
    const publishing = offer.publishState !== 'published'
    if (
      publishing &&
      !window.confirm(
        `Publish "${offer.name}" to the public catalog?\n\nConfirm you have verified this offer against the provider's official source.`
      )
    ) {
      return
    }
    setActioning(offer.id)
    try {
      const res = await authedFetch(`/api/studentvault/offers/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: publishing ? 'publish' : 'unpublish',
          confirmVerified: publishing ? true : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update.')
      toast.success(publishing ? 'Offer published.' : 'Offer moved back to draft.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update.')
    } finally {
      setActioning(null)
    }
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const list = offers.filter((offer) => {
      switch (filter) {
        case 'Live':
          return offer.status === 'live'
        case 'Changed':
          return offer.status === 'changed'
        case 'Ended':
          return offer.status === 'ended'
        case 'Drafts':
          return offer.publishState !== 'published'
        case 'Expiring Soon': {
          const d = daysUntil(offer.expiresOn, now)
          return d !== null && d >= 0 && d <= 30
        }
        case 'Needs Verification': {
          if (!offer.lastVerifiedAt) return true
          const age =
            (now.getTime() - new Date(offer.lastVerifiedAt).getTime()) / 86_400_000
          return age >= STALE_DAYS
        }
        default:
          return true
      }
    })

    // Oldest verification first — stale offers surface immediately (§31).
    return list.sort((a, b) => {
      const at = a.lastVerifiedAt ? new Date(a.lastVerifiedAt).getTime() : 0
      const bt = b.lastVerifiedAt ? new Date(b.lastVerifiedAt).getTime() : 0
      return at - bt
    })
  }, [offers, filter])

  if (busy) {
    return (
      <div className="flex justify-center py-20" aria-live="polite">
        <FaSpinner className="animate-spin text-3xl text-blue-500" />
        <span className="sr-only">Loading offers…</span>
      </div>
    )
  }

  if (denied) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <FaLock className="mx-auto mb-3 text-2xl text-red-400" aria-hidden="true" />
        <p className="font-semibold text-red-300">Access denied</p>
        <p className="text-sm text-red-200/80 mt-1">{denied}</p>
      </div>
    )
  }

  if (creating || editing) {
    return (
      <OfferForm
        offer={editing}
        authedFetch={authedFetch}
        onDone={async () => {
          setCreating(false)
          setEditing(null)
          await load()
        }}
        onCancel={() => {
          setCreating(false)
          setEditing(null)
        }}
      />
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter offers">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          <FaPlus className="text-xs" aria-hidden="true" /> Add New Offer
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {filtered.length} offer{filtered.length === 1 ? '' : 's'} · sorted by oldest
        verification first
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm text-gray-400">
            {offers.length === 0
              ? 'No offers yet. Add the first one — it stays a draft until you verify and publish it.'
              : 'No offers match this filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm min-w-[46rem]">
            <caption className="sr-only">StudentVault offers</caption>
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th scope="col" className="px-4 py-3">Offer</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Last verified</th>
                <th scope="col" className="px-4 py-3">Visibility</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((offer) => {
                const verified = offer.lastVerifiedAt
                  ? new Date(offer.lastVerifiedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'
                const stale =
                  !offer.lastVerifiedAt ||
                  (Date.now() - new Date(offer.lastVerifiedAt).getTime()) /
                    86_400_000 >=
                    STALE_DAYS

                return (
                  <tr key={offer.id} className="text-gray-300">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{offer.name}</div>
                      <div className="text-xs text-gray-500">{offer.category}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{offer.status}</td>
                    <td className={`px-4 py-3 ${stale ? 'text-amber-400' : ''}`}>
                      {verified}
                      {offer.verifiedBy && (
                        <div className="text-xs text-gray-500">{offer.verifiedBy}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {offer.publishState === 'published' ? (
                        <span className="text-emerald-400">Public</span>
                      ) : (
                        <span className="text-gray-500">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => verifyToday(offer)}
                          disabled={actioning === offer.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/25 disabled:opacity-50"
                        >
                          <FaCheckCircle className="text-[10px]" aria-hidden="true" />
                          Verify Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(offer)}
                          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePublish(offer)}
                          disabled={actioning === offer.id}
                          className="rounded-lg bg-blue-600/15 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-600/25 disabled:opacity-50"
                        >
                          {offer.publishState === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
