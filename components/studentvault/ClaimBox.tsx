'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, Lock, ShieldCheck } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Feedback'
import type { OfferGuide } from '@/lib/studentvault/types'
import type { StudentVaultPrice } from '@/lib/studentvault/pricingConfig'
import { BuyPassButton } from './BuyPass'
import { useAuthedFetch, useStudentVaultAccess } from './useStudentVault'

/**
 * The paid part of a perk page. Members who are verified students get the
 * official link and the claim guide; everyone else gets the next step.
 */
export default function ClaimBox({
  offerId,
  slug,
  name,
  price,
}: {
  offerId: string
  slug: string
  name: string
  price: StudentVaultPrice
}) {
  const { access, loading } = useStudentVaultAccess()
  const authedFetch = useAuthedFetch()
  const [link, setLink] = useState<string | null>(null)
  const [guide, setGuide] = useState<OfferGuide | null>(null)
  const [loadingPaid, setLoadingPaid] = useState(false)

  useEffect(() => {
    if (!access?.unlocked) return
    let cancelled = false
    setLoadingPaid(true)
    Promise.all([
      authedFetch('/api/studentvault/links').then((r) => r.json()),
      authedFetch(`/api/studentvault/guides/${offerId}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([links, guideData]) => {
        if (cancelled) return
        setLink(links?.links?.[slug] ?? null)
        setGuide(guideData?.guide ?? null)
      })
      .finally(() => !cancelled && setLoadingPaid(false))
    return () => {
      cancelled = true
    }
  }, [access?.unlocked, authedFetch, offerId, slug])

  const shell = 'rounded-[24px] border border-line bg-surface p-6 shadow-raised sm:p-8'

  if (loading || loadingPaid) {
    return (
      <div className={shell} aria-busy="true">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-6 h-11 w-48 rounded-full" />
      </div>
    )
  }

  if (access?.unlocked) {
    return (
      <div className={shell}>
        <p className="flex items-center gap-2 text-[13px] font-medium text-success">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Unlocked for you
        </p>
        <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-ink">Claim {name}</h2>
        {link ? (
          <ButtonLink href={link} external className="mt-5" trailingIcon={<ArrowUpRight className="h-4 w-4" aria-hidden="true" />}>
            Open the official page
          </ButtonLink>
        ) : (
          <p className="mt-3 text-[15px] text-muted">We’re confirming the official link for this perk. Check back shortly.</p>
        )}
        {guide && guide.claimSteps.length > 0 && (
          <div className="mt-8 border-t border-line pt-6">
            <h3 className="text-[17px] font-semibold text-ink">Step by step</h3>
            <ol className="mt-4 space-y-4">
              {guide.claimSteps.map((step, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {guide.failureModes.length > 0 && (
              <>
                <h3 className="mt-7 text-[15px] font-semibold text-ink">If it doesn’t work</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] text-muted">
                  {guide.failureModes.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
            {guide.proTips.length > 0 && (
              <>
                <h3 className="mt-7 text-[15px] font-semibold text-ink">Pro tips</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] text-muted">
                  {guide.proTips.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  if (access?.paid) {
    return (
      <div className={shell}>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">One step left</h2>
        <p className="mt-2 text-[15px] text-muted">Confirm you’re a student to see the claim link and guide for {name}.</p>
        <ButtonLink href="/studentvault/vault" className="mt-5">
          Verify now
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className={shell}>
      <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
        <Lock className="h-4 w-4" aria-hidden="true" /> Claim link and guide are in the vault
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-ink">Get {name} with the StudentVault pass</h2>
      <p className="mt-2 text-[15px] text-muted">
        The official link, a step-by-step guide, what to do if you’re rejected — for this perk and every other one in the vault.
      </p>
      <BuyPassButton price={price} className="mt-6 max-w-sm" fullWidth />
    </div>
  )
}
