'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

const IMAGE_URL = /^https:\/\/[^\s]+\.(png|jpe?g|svg|webp|gif|avif)(\?[^\s]*)?$/i

function hueFor(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return h
}

/**
 * Brand tile for a perk: the provider's logo when staff have set a direct
 * image URL, otherwise a calm monogram with a stable per-perk tint. No third-
 * party image requests by default, so the catalog stays fast.
 */
export default function PerkLogo({
  name,
  slug,
  logoUrl,
  size = 44,
  className,
}: {
  name: string
  slug: string
  logoUrl?: string
  size?: number
  className?: string
}) {
  const radius = Math.round(size * 0.28)
  // A dead or blocked logo URL falls back to the monogram instead of an empty tile.
  const [failed, setFailed] = useState(false)
  if (logoUrl && IMAGE_URL.test(logoUrl) && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn('shrink-0 border border-line bg-white object-contain p-1.5', className)}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    )
  }
  const letter = (name.trim()[0] || '?').toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={cn('perk-logo inline-flex shrink-0 items-center justify-center font-semibold', className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: Math.round(size * 0.44),
        ['--perk-h' as string]: hueFor(slug),
      }}
    >
      {letter}
    </span>
  )
}
