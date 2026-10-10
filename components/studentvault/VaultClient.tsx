'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, CreditCard, Hourglass, Lock, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Notice, Skeleton } from '@/components/ui/Feedback'
import { SegmentedControl } from '@/components/ui/Controls'
import GoogleButton from '@/components/auth/GoogleButton'
import { useAuth } from '@/lib/AuthContext'
import { formatAccessDate, daysLeft } from '@/lib/studentvault/eligibility'
import { daysUntil, type ClaimItem, type ClaimStatus, type Offer } from '@/lib/studentvault/types'
import type { PlaybookSection, SprintStep } from '@/lib/studentvault/playbook'
import { cn } from '@/lib/cn'
import PerkGrid from './PerkGrid'
import VerifyPanel from './VerifyPanel'
import TestimonialPrompt from './TestimonialPrompt'
import { BuyPassButton, FoundingMeter } from './BuyPass'
import { useAuthedFetch, useStudentVaultAccess, type StudentVaultAccess } from './useStudentVault'

type Tab = 'perks' | 'guides' | 'deadlines'

interface VaultData {
  playbook: PlaybookSection[]
  sprint: SprintStep[]
  claims: ClaimItem[]
}

export function VaultSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your vault">
      <Skeleton className="h-28 w-full rounded-card" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-card" />
        ))}
      </div>
    </div>
  )
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card sm:p-7', className)}>{children}</section>
}

function SignInPanel() {
  const { signInWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  return (
    <Panel className="mx-auto max-w-md text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-ink">Sign in to open your vault</h2>
      <p className="mt-2 text-[15px] text-muted">Your pass, verification and claim tracker live with your matriXO account.</p>
      <GoogleButton
        className="mt-6"
        loading={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await signInWithGoogle()
          } catch (error: any) {
            if (error?.code !== 'auth/popup-closed-by-user') toast.error('Google sign-in didn’t finish. Try again.')
          } finally {
            setBusy(false)
          }
        }}
      />
      <Link href="/auth?returnUrl=/studentvault/vault" className="mt-4 inline-block text-[14px] text-accent hover:underline">
        Other ways to sign in
      </Link>
    </Panel>
  )
}

export default function VaultClient({ offers }: { offers: Offer[] }) {
  const params = useSearchParams()
  const welcome = params.get('welcome') === '1'
  const { user, access, price, loading, error, setAccess, refresh } = useStudentVaultAccess()

  if (loading) return <VaultSkeleton />
  if (!user) return <SignInPanel />
  if (error || !access) {
    return (
      <Notice tone="danger" title="We couldn’t load your vault">
        {error || 'Please refresh the page.'}{' '}
        <button type="button" className="font-medium text-accent hover:underline" onClick={refresh}>
          Try again
        </button>
      </Notice>
    )
  }

  if (access.unlocked) {
    return <UnlockedVault offers={offers} access={access} onAccess={setAccess} welcome={welcome} />
  }

  return <LockedVault access={access} price={price} onAccess={setAccess} welcome={welcome} offers={offers} />
}

function LockedVault({
  access,
  price,
  onAccess,
  welcome,
  offers,
}: {
  access: StudentVaultAccess
  price: ReturnType<typeof useStudentVaultAccess>['price']
  onAccess: (a: StudentVaultAccess) => void
  welcome: boolean
  offers: Offer[]
}) {
  const v = access.verification
  const [showVerify, setShowVerify] = useState(access.paid)
  const total = offers.filter((o) => o.status !== 'ended').reduce((s, o) => s + (o.valueInr || 0), 0)

  if (v.status === 'graduated') {
    return (
      <Panel className="max-w-2xl">
        <h2 className="text-[22px] font-semibold text-ink">Your student access has ended</h2>
        <p className="mt-2 text-[15px] text-muted">
          Student perks end with your graduation year. Congratulations on graduating — thanks for being part of StudentVault.
        </p>
      </Panel>
    )
  }

  return (
    <div className="space-y-5">
      {welcome && access.paid && (
        <Notice tone="success" title="Payment received — thank you!">
          Your StudentVault pass is active. Verify that you’re a student below to unlock every claim link.
        </Notice>
      )}

      {access.paid && v.status === 'pending_review' && (
        <Panel>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-warning/10 text-warning">
              <Hourglass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[19px] font-semibold text-ink">We’re checking your document</h2>
              <p className="mt-1 text-[15px] text-muted">
                Usually under a day — we’ll email you when it’s done. Want it unlocked right now? Verify with your college email instead.
              </p>
            </div>
          </div>
        </Panel>
      )}

      {!access.paid && (
        <Panel>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">StudentVault pass</p>
              <h2 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
                {v.status === 'verified' ? 'You’re verified. One step to unlock.' : 'Unlock every claim link and guide.'}
              </h2>
              <p className="mt-2 text-[15px] text-muted">
                {offers.length} perks worth ≈ ₹{total.toLocaleString('en-IN')} — with the official links, step-by-step guides, deadline alerts and your tracker.
              </p>
              {price && <FoundingMeter price={price} className="mt-5" />}
            </div>
            {price && <BuyPassButton price={price} className="lg:w-80" fullWidth />}
          </div>
        </Panel>
      )}

      {(access.paid || v.status !== 'verified') && (
        <Panel>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[19px] font-semibold text-ink">
                {access.paid ? 'One step left: confirm you’re a student' : 'Verify you’re a student'}
              </h2>
              <p className="mt-1 text-[15px] text-muted">
                {access.paid
                  ? 'Use your college email for an instant unlock, or upload your student ID.'
                  : 'Optional now — do it before or after you buy. It takes about a minute.'}
              </p>
            </div>
            {!access.paid && !showVerify && (
              <Button variant="secondary" size="sm" onClick={() => setShowVerify(true)}>
                Verify now
              </Button>
            )}
          </div>
          {v.status === 'rejected' && (
            <Notice tone="warning" className="mt-4" title="We couldn’t accept your last document">
              {v.idReviewNote || 'Upload a clearer photo, or use your college email.'}
            </Notice>
          )}
          {v.status === 'expired' && (
            <Notice tone="warning" className="mt-4" title="Time to re-confirm">
              Your student verification has lapsed. Re-confirm to keep using the vault.
            </Notice>
          )}
          {showVerify && (
            <div className="mt-6 border-t border-line pt-6">
              <VerifyPanel access={access} onAccess={onAccess} reverify={v.status === 'expired'} />
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}

function UnlockedVault({
  offers,
  access,
  onAccess,
  welcome,
}: {
  offers: Offer[]
  access: StudentVaultAccess
  onAccess: (a: StudentVaultAccess) => void
  welcome: boolean
}) {
  const { user } = useAuth()
  const authedFetch = useAuthedFetch()
  const [tab, setTab] = useState<Tab>('perks')
  const [data, setData] = useState<VaultData | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [claims, setClaims] = useState<Record<string, ClaimStatus>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reverifyOpen, setReverifyOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([authedFetch('/api/studentvault/vault'), authedFetch('/api/studentvault/links')])
      .then(async ([vaultRes, linksRes]) => {
        const [vault, linkData] = await Promise.all([vaultRes.json(), linksRes.json()])
        if (cancelled) return
        if (!vaultRes.ok) throw new Error(vault.error || 'Could not load your vault.')
        setData(vault)
        setLinks(linkData.links || {})
        setClaims(Object.fromEntries((vault.claims as ClaimItem[]).map((c) => [c.offerSlug, c.status])))
      })
      .catch((err) => !cancelled && setLoadError(err instanceof Error ? err.message : 'Could not load your vault.'))
    return () => {
      cancelled = true
    }
  }, [authedFetch])

  const changeClaim = useCallback(
    async (slug: string, status: ClaimStatus) => {
      if (!user) return
      const previous = claims[slug]
      setClaims((c) => ({ ...c, [slug]: status }))
      try {
        const { db, doc, setDoc } = await import('@/lib/firebase/lazyFirestore').then((m) => m.loadFirestore())
        await setDoc(
          doc(db, 'studentvault_claims', user.uid, 'items', slug),
          {
            offerSlug: slug,
            status,
            claimedAt: status === 'claimed' ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
        if (status === 'claimed') toast.success('Nice — marked as claimed.')
      } catch {
        setClaims((c) => ({ ...c, [slug]: previous ?? 'todo' }))
        toast.error('Could not save. Try again.')
      }
    },
    [claims, user]
  )

  const live = offers.filter((o) => o.status !== 'ended')
  const claimedSlugs = Object.entries(claims).filter(([, s]) => s === 'claimed').map(([slug]) => slug)
  const claimedValue = offers.filter((o) => claimedSlugs.includes(o.slug)).reduce((s, o) => s + (o.valueInr || 0), 0)
  const deadlines = useMemo(
    () =>
      live
        .map((o) => ({ offer: o, days: daysUntil(o.expiresOn) }))
        .filter((x): x is { offer: Offer; days: number } => x.days !== null && x.days >= 0)
        .sort((a, b) => a.days - b.days),
    [live]
  )
  const cardOffers = live.filter((o) => o.requiresCard)
  const v = access.verification
  const left = daysLeft(v.expiresAt)

  return (
    <div className="space-y-6">
      {welcome && (
        <Notice tone="success" title="You’re all set">
          Payment received and you’re verified — every claim link is unlocked below.
        </Notice>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Verified student
        </span>
        {v.expiresAt && (
          <span className="text-muted">
            Access until {formatAccessDate(v.expiresAt)}
            {left !== null && left <= 30 ? ` · ${left} days left` : ''}
          </span>
        )}
        {v.college && <span className="text-subtle">{v.college}</span>}
      </div>

      {access.reverifyDue && (
        <Notice tone="warning" title="Quick check-in due">
          Confirm you’re still a student to keep your vault open past {v.expiresAt ? formatAccessDate(v.expiresAt) : 'the deadline'}.{' '}
          <button type="button" className="font-medium text-accent hover:underline" onClick={() => setReverifyOpen((o) => !o)}>
            {reverifyOpen ? 'Hide' : 'Re-confirm now'}
          </button>
        </Notice>
      )}
      {reverifyOpen && (
        <Panel>
          <VerifyPanel
            access={access}
            reverify
            onAccess={(a) => {
              onAccess(a)
              setReverifyOpen(false)
              toast.success('Thanks — you’re all set.')
            }}
          />
        </Panel>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Perks claimed', value: `${claimedSlugs.length}/${live.length}` },
          { label: 'Value claimed', value: `₹${claimedValue.toLocaleString('en-IN')}` },
          { label: 'Deadlines in 30 days', value: String(deadlines.filter((d) => d.days <= 30).length) },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-line bg-surface p-4 sm:p-5">
            <p className="text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-ink sm:text-[28px]">{s.value}</p>
            <p className="mt-0.5 text-[12px] text-muted sm:text-[13px]">{s.label}</p>
          </div>
        ))}
      </div>

      <SegmentedControl<Tab>
        label="Vault sections"
        value={tab}
        onChange={setTab}
        segments={[
          { value: 'perks', label: 'Perks', count: live.length },
          { value: 'guides', label: 'Guides' },
          { value: 'deadlines', label: 'Deadlines', count: deadlines.length + cardOffers.length },
        ]}
      />

      {loadError && <Notice tone="danger">{loadError}</Notice>}

      {tab === 'perks' &&
        (data ? (
          <PerkGrid offers={live} variant="vault" links={links} claims={claims} onClaimChange={changeClaim} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-48 rounded-card" />
            ))}
          </div>
        ))}

      {tab === 'guides' &&
        (data ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-[19px] font-semibold text-ink">The 90-minute sprint</h2>
              <p className="mt-1 text-[14px] text-muted">Do these in order — each one makes the next easier.</p>
              <ol className="mt-4 space-y-3">
                {data.sprint.map((step) => (
                  <li key={step.order} className="flex gap-4 rounded-card border border-line bg-surface p-4 sm:p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-solid text-[14px] font-semibold text-accent-fg">
                      {step.order}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">
                        {step.title} <span className="text-[13px] font-normal text-subtle">· {step.minutes} min</span>
                      </p>
                      <p className="mt-1 text-[14px] leading-relaxed text-muted">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-[19px] font-semibold text-ink">Verification playbook</h2>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {data.playbook.map((section) => (
                  <section key={section.title} className="rounded-card border border-line bg-surface p-5">
                    <h3 className="font-semibold text-ink">{section.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{section.body}</p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] text-muted">
                      {section.points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
            <p className="text-[14px] text-muted">Each perk’s page also has its own step-by-step claim guide once you’re unlocked.</p>
          </div>
        ) : (
          <Skeleton className="h-64 rounded-card" />
        ))}

      {tab === 'deadlines' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
              <CalendarClock className="h-4 w-4 text-accent" aria-hidden="true" /> Deadline radar
            </h2>
            {deadlines.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">No perks with upcoming deadlines right now.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
                {deadlines.map(({ offer, days }) => (
                  <li key={offer.id}>
                    <Link href={`/studentvault/${offer.slug}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-canvas-subtle">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-ink">{offer.name}</span>
                        <span className="text-[13px] text-subtle">{formatAccessDate(offer.expiresOn!)}</span>
                      </span>
                      <span className={cn('shrink-0 text-[14px] font-semibold tabular-nums', days <= 14 ? 'text-danger' : days <= 30 ? 'text-warning' : 'text-muted')}>
                        <Clock3 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                        {days === 0 ? 'Today' : `${days}d`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink">
              <CreditCard className="h-4 w-4 text-warning" aria-hidden="true" /> Auto-charge guard
            </h2>
            <p className="mt-1 text-[14px] text-muted">These ask for a card. Set a reminder before each renewal.</p>
            <ul className="mt-3 space-y-2">
              {cardOffers.map((offer) => (
                <li key={offer.id} className="rounded-card border border-line bg-surface p-4">
                  <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
                    <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                    {offer.name}
                  </p>
                  <p className="mt-1 text-[14px] text-muted">{offer.autoChargeNote || 'Check the provider’s renewal terms.'}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {claimedSlugs.length > 0 || welcome ? (
        <TestimonialPrompt />
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-subtle">
          <PartyPopper className="h-4 w-4" aria-hidden="true" /> Mark perks as claimed to track the value you’ve unlocked.
        </p>
      )}
    </div>
  )
}
