'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { GoogleGlyph } from '@/components/brand/GoogleGlyph'
import { cn } from '@/lib/cn'
import type { StudentVaultPrice } from '@/lib/studentvault/pricingConfig'
import { useStudentVaultAccess, useStudentVaultCheckout } from './useStudentVault'

function useOwnership() {
  const { access, loading } = useStudentVaultAccess()
  return { owned: Boolean(access?.paid), loading }
}

/** Main purchase button. Signs in with Google first if needed, then opens Razorpay. */
export function BuyPassButton({
  price,
  size = 'lg',
  fullWidth,
  className,
  showNote = true,
  compact = false,
}: {
  price: StudentVaultPrice
  size?: 'md' | 'lg'
  fullWidth?: boolean
  className?: string
  showNote?: boolean
  /** Shorter label without the price (sticky bar on phones). */
  compact?: boolean
}) {
  const { begin, busy, phase, error, signedIn } = useStudentVaultCheckout()
  const { owned } = useOwnership()

  if (owned) {
    return (
      <div className={className}>
        <ButtonLink href="/studentvault/vault" size={size} fullWidth={fullWidth} trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
          Open your vault
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button
        size={size}
        fullWidth={fullWidth}
        loading={busy}
        onClick={begin}
        leadingIcon={!signedIn && !busy ? <GoogleGlyph className="h-4 w-4" /> : undefined}
      >
        {phase === 'signing-in'
          ? 'Signing you in…'
          : phase === 'opening'
            ? 'Opening checkout…'
            : compact
              ? signedIn
                ? 'Get the pass'
                : 'Continue'
              : signedIn
                ? `Get the pass · ₹${price.amount}`
                : `Continue with Google · ₹${price.amount}`}
      </Button>
      {showNote && (
        <p className={cn('mt-2.5 text-[13px]', phase === 'failed' ? 'text-danger' : 'text-subtle')} role={phase === 'failed' ? 'alert' : undefined}>
          {phase === 'failed'
            ? error || 'Payment didn’t go through. You haven’t been charged — try again.'
            : phase === 'dismissed'
              ? 'Checkout closed. You haven’t been charged.'
              : 'One-time payment · UPI, cards, netbanking · 7‑day refund'}
        </p>
      )}
    </div>
  )
}

/** Founding-price meter: "312 of 500 founding passes left". */
export function FoundingMeter({ price, className }: { price: StudentVaultPrice; className?: string }) {
  if (price.tier !== 'founding') return null
  const total = 500
  const taken = Math.max(0, total - price.foundingLeft)
  const pct = Math.min(100, Math.max(4, (taken / total) * 100))
  return (
    <div className={cn('w-full max-w-sm', className)}>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="font-medium text-ink">Founding price ₹{price.amount}</span>
        <span className="tabular-nums text-muted">
          {price.foundingLeft >= total ? `First ${total} students` : `${price.foundingLeft} of ${total} left`} · then ₹{price.regular}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas-subtle" aria-hidden="true">
        <div className="h-full rounded-full bg-accent-solid" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/**
 * Bottom bar that appears once the hero's buy button scrolls out of view,
 * so the purchase is always one tap away.
 */
export function StickyBuyBar({ price, totalValueLabel, watchId }: { price: StudentVaultPrice; totalValueLabel: string; watchId: string }) {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { owned } = useOwnership()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const target = document.getElementById(watchId)
    if (!target || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      threshold: 0,
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [watchId])

  if (owned || !mounted) return null

  // Portal to <body>: an animated (transformed) page wrapper would otherwise
  // pin this "fixed" bar to the wrapper instead of the viewport.
  return createPortal(
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-xl transition-transform duration-300 ease-out supports-[backdrop-filter]:bg-surface/75',
        show ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-site items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">StudentVault · ₹{price.amount}</p>
          <p className="truncate text-[13px] text-muted">
            {totalValueLabel} of perks
            {price.tier === 'founding' ? (price.foundingLeft >= 500 ? ' · founding price' : ` · ${price.foundingLeft} founding passes left`) : ''}
          </p>
        </div>
        <BuyPassButton price={price} size="md" showNote={false} compact className="shrink-0 sm:hidden" />
        <BuyPassButton price={price} size="md" showNote={false} className="hidden shrink-0 sm:block" />
      </div>
    </div>,
    document.body
  )
}
