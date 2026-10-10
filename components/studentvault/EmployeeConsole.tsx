'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Download, Eye, EyeOff, FileText, Lock, Plus, RotateCcw, Undo2 } from 'lucide-react'
import type { Offer } from '@/lib/studentvault/types'
import { daysUntil } from '@/lib/studentvault/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Field'
import { EmptyState, Notice, Skeleton } from '@/components/ui/Feedback'
import { SegmentedControl } from '@/components/ui/Controls'
import { cn } from '@/lib/cn'
import OfferForm from './OfferForm'
import PerkLogo from './PerkLogo'

/**
 * Supplies the caller's Firebase ID token. The console works from either the
 * employee portal or a normal website session — the server decides whether the
 * token belongs to an employee.
 */
type GetIdToken = () => Promise<string | undefined>
type AuthedFetch = (url: string, init?: RequestInit) => Promise<Response>

type Tab = 'offers' | 'verifications' | 'testimonials' | 'sales'

const FILTERS = ['All', 'Not checked', 'Stale', 'Changed', 'Ended', 'Hidden', 'Expiring'] as const
type Filter = (typeof FILTERS)[number]

const STALE_DAYS = 30

function useAuthedFetch(getIdToken: GetIdToken): AuthedFetch {
  return useCallback(
    async (url: string, init: RequestInit = {}) => {
      const token = await getIdToken()
      return fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers || {}),
        },
      })
    },
    [getIdToken]
  )
}

export default function EmployeeConsole({ getIdToken }: { getIdToken: GetIdToken }) {
  const authedFetch = useAuthedFetch(getIdToken)
  const [tab, setTab] = useState<Tab>('offers')
  const [pending, setPending] = useState<number | null>(null)

  useEffect(() => {
    authedFetch('/api/studentvault/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPending(d.pendingReviews))
      .catch(() => {})
  }, [authedFetch])

  return (
    <div className="space-y-6">
      <SegmentedControl<Tab>
        label="Console sections"
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'offers', label: 'Offers' },
          { value: 'verifications', label: 'Verifications', count: pending ?? undefined },
          { value: 'testimonials', label: 'Testimonials' },
          { value: 'sales', label: 'Sales' },
        ]}
      />
      {tab === 'offers' && <OffersTab authedFetch={authedFetch} />}
      {tab === 'verifications' && <VerificationsTab authedFetch={authedFetch} onCount={setPending} />}
      {tab === 'testimonials' && <TestimonialsTab authedFetch={authedFetch} />}
      {tab === 'sales' && <SalesTab authedFetch={authedFetch} />}
    </div>
  )
}

function Denied({ message }: { message: string }) {
  return (
    <EmptyState icon={<Lock className="h-5 w-5" />} title="Access denied" description={message} className="rounded-card border border-line bg-surface" />
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  )
}

// ── Offers ───────────────────────────────────────────────────────────────

function OffersTab({ authedFetch }: { authedFetch: AuthedFetch }) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [busy, setBusy] = useState(true)
  const [denied, setDenied] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Offer | null>(null)
  const [creating, setCreating] = useState(false)
  const [actioning, setActioning] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const load = useCallback(async () => {
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
  }, [authedFetch])

  useEffect(() => {
    load()
  }, [load])

  const act = async (offer: Offer, body: Record<string, unknown>, success: string) => {
    setActioning(offer.id)
    try {
      const res = await authedFetch(`/api/studentvault/offers/${offer.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update.')
      toast.success(success)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update.')
    } finally {
      setActioning(null)
    }
  }

  const toggleChecked = (offer: Offer) => {
    if (offer.lastVerifiedAt) return act(offer, { action: 'unverify' }, `${offer.name} marked as not checked.`)
    if (!window.confirm(`Confirm you’ve just checked "${offer.name}" against the provider’s official page.`)) return
    return act(offer, { action: 'verify' }, `${offer.name} marked as checked today.`)
  }

  const toggleVisible = (offer: Offer) =>
    offer.publishState === 'published'
      ? act(offer, { action: 'unpublish' }, `${offer.name} is hidden from the public.`)
      : act(offer, { action: 'publish' }, `${offer.name} is visible again.`)

  const importCatalog = async () => {
    if (!window.confirm('Import the researched starter catalog? New perks go live as “Researched”; existing perks only get empty fields filled.')) return
    setImporting(true)
    try {
      const res = await authedFetch('/api/studentvault/offers/import', { method: 'POST', body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed.')
      toast.success(`Imported: ${data.created.length} new, ${data.filled.length} updated, ${data.linksMigrated} links secured.`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const filtered = useMemo(() => {
    const now = Date.now()
    const term = query.trim().toLowerCase()
    return offers
      .filter((o) => {
        if (term && !`${o.name} ${o.category}`.toLowerCase().includes(term)) return false
        switch (filter) {
          case 'Not checked':
            return !o.lastVerifiedAt
          case 'Stale':
            return Boolean(o.lastVerifiedAt) && (now - new Date(o.lastVerifiedAt!).getTime()) / 86_400_000 >= STALE_DAYS
          case 'Changed':
            return o.status === 'changed'
          case 'Ended':
            return o.status === 'ended'
          case 'Hidden':
            return o.publishState !== 'published'
          case 'Expiring': {
            const d = daysUntil(o.expiresOn)
            return d !== null && d >= 0 && d <= 30
          }
          default:
            return true
        }
      })
      .sort((a, b) => (a.lastVerifiedAt ? new Date(a.lastVerifiedAt).getTime() : 0) - (b.lastVerifiedAt ? new Date(b.lastVerifiedAt).getTime() : 0))
  }, [offers, filter, query])

  if (busy) return <ListSkeleton />
  if (denied) return <Denied message={denied} />

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

  const unchecked = offers.filter((o) => !o.lastVerifiedAt).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" leadingIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
          Add offer
        </Button>
        <Button size="sm" variant="secondary" loading={importing} leadingIcon={<Download className="h-4 w-4" />} onClick={importCatalog}>
          Import researched catalog
        </Button>
        <span className="text-[13px] text-muted">
          {offers.length} offers · {unchecked} not yet checked by staff
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 no-scrollbar" role="group" aria-label="Filter offers">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium transition-colors',
                filter === f ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-muted hover:text-ink'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search offers" aria-label="Search offers" containerClassName="lg:w-64" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={offers.length === 0 ? 'No offers yet' : 'Nothing matches this filter'}
          description={offers.length === 0 ? 'Import the researched catalog to get started.' : undefined}
          className="rounded-card border border-line bg-surface"
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {filtered.map((offer) => {
            const checkedOn = offer.lastVerifiedAt
              ? new Date(offer.lastVerifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null
            const stale = offer.lastVerifiedAt && (Date.now() - new Date(offer.lastVerifiedAt).getTime()) / 86_400_000 >= STALE_DAYS
            const hidden = offer.publishState !== 'published'
            return (
              <li key={offer.id} className={cn('flex flex-col gap-3 p-4 sm:flex-row sm:items-center', hidden && 'bg-canvas-subtle/60')}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <PerkLogo name={offer.name} slug={offer.slug} logoUrl={offer.logoUrl} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-ink">{offer.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-subtle">
                      <span>{offer.category}</span>
                      {offer.status !== 'live' && <Badge tone={offer.status === 'ended' ? 'neutral' : 'warning'}>{offer.status}</Badge>}
                      {hidden && <Badge>Hidden</Badge>}
                      {!offer.officialUrl && <Badge tone="danger">No link</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => toggleChecked(offer)}
                    disabled={actioning === offer.id}
                    title={checkedOn ? `Checked by ${offer.verifiedBy || 'staff'} — click to undo` : 'Mark as checked today'}
                    className={cn(
                      'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-50',
                      checkedOn
                        ? stale
                          ? 'border-warning/30 bg-warning/10 text-warning'
                          : 'border-success/30 bg-success/10 text-success'
                        : 'border-line text-muted hover:border-line-strong hover:text-ink'
                    )}
                  >
                    {checkedOn ? <CheckCircle2 className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    {checkedOn ? `Checked ${checkedOn}` : 'Not checked'}
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(offer)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actioning === offer.id}
                    onClick={() => toggleVisible(offer)}
                    leadingIcon={hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  >
                    {hidden ? 'Show' : 'Hide'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Verifications ────────────────────────────────────────────────────────

interface ReviewItem {
  uid: string
  college: string
  graduationYear: number | null
  studyStatus: string | null
  status: string
  docType: string
  uploadedAt: string | null
  fileUrl: string | null
  isPdf: boolean
}

const DOC_LABELS: Record<string, string> = {
  student_id: 'College ID',
  bonafide: 'Bonafide certificate',
  fee_receipt: 'Fee receipt',
  admission_letter: 'Admission letter',
}

function VerificationsTab({ authedFetch, onCount }: { authedFetch: AuthedFetch; onCount: (n: number) => void }) {
  const [items, setItems] = useState<ReviewItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await authedFetch('/api/studentvault/verify/review')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load reviews.')
      setItems(data.items)
      onCount(data.items.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews.')
    }
  }, [authedFetch, onCount])

  useEffect(() => {
    load()
  }, [load])

  const decide = async (uid: string, decision: 'approved' | 'rejected') => {
    setActing(uid)
    try {
      const res = await authedFetch('/api/studentvault/verify/review', {
        method: 'POST',
        body: JSON.stringify({ uid, decision, note: notes[uid] ?? '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save.')
      toast.success(decision === 'approved' ? 'Approved — the student has been emailed.' : 'Rejected — the student has been emailed.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setActing(null)
    }
  }

  if (error) return <Notice tone="danger">{error}</Notice>
  if (!items) return <ListSkeleton />
  if (items.length === 0) {
    return <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="All caught up" description="No student documents waiting for review." className="rounded-card border border-line bg-surface" />
  }

  return (
    <div className="space-y-3">
      <Notice tone="info">
        Approve only if the name, college and a current date or validity are readable. Links expire after 15 minutes — reload to refresh them.
      </Notice>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.uid} className="grid gap-4 rounded-card border border-line bg-surface p-4 sm:grid-cols-[160px_1fr]">
            {item.fileUrl ? (
              item.isPdf ? (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="flex h-40 items-center justify-center gap-2 rounded-2xl bg-canvas-subtle text-[14px] font-medium text-accent">
                  <FileText className="h-5 w-5" /> Open PDF
                </a>
              ) : (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl bg-canvas-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.fileUrl} alt={`${DOC_LABELS[item.docType] ?? 'Document'} upload`} className="h-40 w-full object-cover" />
                </a>
              )
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl bg-canvas-subtle text-[13px] text-subtle">File unavailable</div>
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-ink">{item.college || 'College not given'}</p>
              <p className="mt-0.5 text-[13px] text-muted">
                {DOC_LABELS[item.docType] ?? item.docType} · graduating {item.graduationYear ?? '—'}
                {item.studyStatus === 'changed_college' ? ' · changed college' : ''}
                {item.uploadedAt ? ` · uploaded ${new Date(item.uploadedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-subtle">User {item.uid}</p>
              <Input
                containerClassName="mt-3"
                placeholder="Reason (required to reject) — e.g. date not visible"
                value={notes[item.uid] ?? ''}
                onChange={(e) => setNotes((n) => ({ ...n, [item.uid]: e.target.value }))}
                aria-label="Review note"
              />
              <div className="mt-3 flex gap-2">
                <Button size="sm" loading={acting === item.uid} onClick={() => decide(item.uid, 'approved')}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" disabled={acting === item.uid} onClick={() => decide(item.uid, 'rejected')}>
                  Reject
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Testimonials ─────────────────────────────────────────────────────────

interface TestimonialRow {
  uid: string
  name: string
  college: string
  quote: string
  rating: number
  hidden: boolean
  createdAt: string | null
}

function TestimonialsTab({ authedFetch }: { authedFetch: AuthedFetch }) {
  const [items, setItems] = useState<TestimonialRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await authedFetch('/api/studentvault/testimonials/manage')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load testimonials.')
      setItems(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load testimonials.')
    }
  }, [authedFetch])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (row: TestimonialRow) => {
    const res = await authedFetch('/api/studentvault/testimonials/manage', {
      method: 'POST',
      body: JSON.stringify({ uid: row.uid, hidden: !row.hidden }),
    })
    if (res.ok) {
      toast.success(row.hidden ? 'Testimonial is visible again.' : 'Testimonial hidden.')
      load()
    } else toast.error('Could not update.')
  }

  if (error) return <Notice tone="danger">{error}</Notice>
  if (!items) return <ListSkeleton />
  if (items.length === 0) {
    return (
      <EmptyState
        title="No testimonials yet"
        description="Verified members are asked for one in their vault. New ones appear on the StudentVault page right away — hide any that shouldn’t be there."
        className="rounded-card border border-line bg-surface"
      />
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((row) => (
        <li key={row.uid} className={cn('rounded-card border border-line bg-surface p-4', row.hidden && 'opacity-60')}>
          <p className="text-[15px] leading-relaxed text-ink">“{row.quote}”</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-muted">
              {row.name}
              {row.college ? ` · ${row.college}` : ''} · {row.rating}/5
              {row.hidden ? ' · hidden' : ''}
            </p>
            <Button size="sm" variant="ghost" onClick={() => toggle(row)} leadingIcon={row.hidden ? <Undo2 className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}>
              {row.hidden ? 'Show' : 'Hide'}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Sales ────────────────────────────────────────────────────────────────

function SalesTab({ authedFetch }: { authedFetch: AuthedFetch }) {
  const [stats, setStats] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    authedFetch('/api/studentvault/stats')
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Could not load stats.')
        setStats(d)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load stats.'))
  }, [authedFetch])

  if (error) return <Notice tone="danger">{error}</Notice>
  if (!stats) return <ListSkeleton />

  const cards = [
    { label: 'Passes sold', value: stats.passes },
    { label: 'Revenue', value: `₹${Number(stats.revenue).toLocaleString('en-IN')}` },
    { label: 'Sold in the last 7 days', value: stats.soldLast7Days },
    { label: 'Founding passes left', value: stats.price?.tier === 'founding' ? stats.price.foundingLeft : 'Sold out' },
    { label: 'Current price', value: `₹${stats.price?.amount}` },
    { label: 'Verified students', value: stats.verifiedStudents },
    { label: 'Waiting for ID review', value: stats.pendingReviews },
  ]

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <li key={c.label} className="rounded-card border border-line bg-surface p-5">
          <p className="text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-ink">{c.value}</p>
          <p className="mt-0.5 text-[13px] text-muted">{c.label}</p>
        </li>
      ))}
    </ul>
  )
}
