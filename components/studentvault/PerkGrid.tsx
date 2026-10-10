'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CreditCard, Lock, Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { CLAIM_STATUSES, OFFER_CATEGORIES, daysUntil, type ClaimStatus, type Offer } from '@/lib/studentvault/types'
import PerkLogo from './PerkLogo'
import { TrustBadge } from './perkMeta'

const CLAIM_LABELS: Record<ClaimStatus, string> = {
  todo: 'To claim',
  claimed: 'Claimed',
  rejected: 'Rejected',
  expired: 'Expired',
}

type Props = {
  offers: Offer[]
  variant?: 'public' | 'vault'
  /** slug → official URL (vault only). */
  links?: Record<string, string>
  claims?: Record<string, ClaimStatus>
  onClaimChange?: (slug: string, status: ClaimStatus) => void
  /** Show only this many cards until "Show all" (the rest stay in the HTML). */
  initialLimit?: number
}

export default function PerkGrid({ offers, variant = 'public', links, claims, onClaimChange, initialLimit }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [expanded, setExpanded] = useState(false)

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    offers.forEach((o) => counts.set(o.category, (counts.get(o.category) ?? 0) + 1))
    const ordered = (OFFER_CATEGORIES as readonly string[]).filter((c) => counts.has(c))
    const extra = Array.from(counts.keys()).filter((c) => !ordered.includes(c)).sort()
    return [{ name: 'All', count: offers.length }, ...[...ordered, ...extra].map((name) => ({ name, count: counts.get(name)! }))]
  }, [offers])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return offers.filter((o) => {
      if (category !== 'All' && o.category !== category) return false
      if (!term) return true
      return `${o.name} ${o.summary} ${o.category}`.toLowerCase().includes(term)
    })
  }, [offers, query, category])

  const collapsed = Boolean(initialLimit) && !expanded && !query && category === 'All' && visible.length > initialLimit!

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter perks by category"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {categories.map((c) => {
            const active = c.name === category
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.name)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
                )}
              >
                {c.name}
                <span className={cn('tabular-nums text-[12px]', active ? 'text-canvas/70' : 'text-subtle')}>{c.count}</span>
              </button>
            )
          })}
        </div>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search perks"
          aria-label="Search perks"
          leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          containerClassName="w-full lg:w-72 lg:shrink-0"
        />
      </div>

      <p className="mt-5 text-[13px] text-subtle" aria-live="polite">
        {visible.length === offers.length ? `${offers.length} perks` : `${visible.length} of ${offers.length} perks`}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-card border border-dashed border-line px-6 py-14 text-center">
          <p className="text-[15px] font-medium text-ink">No perks match that.</p>
          <button
            type="button"
            className="mt-2 text-[14px] font-medium text-accent hover:underline"
            onClick={() => {
              setQuery('')
              setCategory('All')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((offer, index) => (
            <li key={offer.id} className={cn(collapsed && index >= initialLimit! && 'hidden')}>
              <PerkCard
                offer={offer}
                variant={variant}
                link={links?.[offer.slug]}
                claim={claims?.[offer.slug]}
                onClaimChange={onClaimChange}
              />
            </li>
          ))}
        </ul>
      )}
      {collapsed && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex h-11 items-center rounded-full border border-line-strong bg-surface px-6 text-[15px] font-medium text-ink transition-colors hover:bg-canvas-subtle"
          >
            Show all {visible.length} perks
          </button>
        </div>
      )}
    </div>
  )
}

function PerkCard({
  offer,
  variant,
  link,
  claim,
  onClaimChange,
}: {
  offer: Offer
  variant: 'public' | 'vault'
  link?: string
  claim?: ClaimStatus
  onClaimChange?: (slug: string, status: ClaimStatus) => void
}) {
  const days = daysUntil(offer.expiresOn)
  const deadline = days !== null && days >= 0 && days <= 60 ? days : null

  return (
    <article className="group relative flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-[box-shadow,border-color] duration-200 hover:border-line-strong hover:shadow-raised">
      <div className="flex items-start gap-3.5">
        <PerkLogo name={offer.name} slug={offer.slug} logoUrl={offer.logoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={`/studentvault/${offer.slug}`} className="after:absolute after:inset-0 after:rounded-card focus:outline-none">
              {offer.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-[13px] text-subtle">
            {offer.category}
            {offer.valueInr > 0 && <span className="text-muted"> · worth ≈ ₹{offer.valueInr.toLocaleString('en-IN')}</span>}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-muted">{offer.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <TrustBadge offer={offer} />
        {deadline !== null && (
          <Badge tone={deadline <= 14 ? 'danger' : 'warning'}>{deadline === 0 ? 'Ends today' : `${deadline} days left`}</Badge>
        )}
        {offer.requiresCard && (
          <Badge tone="warning">
            <CreditCard className="h-3 w-3" aria-hidden="true" /> Card needed
          </Badge>
        )}
      </div>

      <div className="mt-auto pt-4">
        {variant === 'public' ? (
          <p className="flex items-center gap-1.5 border-t border-line pt-3.5 text-[13px] text-subtle">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Link and guide unlock with the pass
          </p>
        ) : (
          <div className="relative z-10 flex items-center gap-2 border-t border-line pt-3.5">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex h-9 items-center gap-1 rounded-full bg-accent-solid px-4 text-[13px] font-medium text-accent-fg transition-colors hover:bg-accent-solid-hover"
              >
                Claim <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span className="text-[13px] text-subtle">Link coming soon</span>
            )}
            {onClaimChange && (
              <select
                aria-label={`Your status for ${offer.name}`}
                value={claim ?? 'todo'}
                onChange={(e) => onClaimChange(offer.slug, e.target.value as ClaimStatus)}
                className={cn(
                  'ml-auto h-9 rounded-full border bg-surface px-3 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-accent/15',
                  claim === 'claimed' ? 'border-success/40 text-success' : 'border-line text-muted'
                )}
              >
                {CLAIM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CLAIM_LABELS[s]}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
