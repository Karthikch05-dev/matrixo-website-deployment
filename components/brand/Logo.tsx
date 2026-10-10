'use client'

import { useId } from 'react'
import { LOGO_PATH, LOGO_VIEWBOX, MARK_PATH, MARK_VIEWBOX, O_COUNTER } from './logoPaths'

type LogoProps = {
  /** `wordmark` is the full "matriXO"; `mark` is the XO monogram. */
  variant?: 'wordmark' | 'mark'
  /** Rendered height in px; width follows the artwork's aspect ratio. */
  height?: number
  className?: string
  /** Accessible name. Pass an empty string when the logo sits inside a labelled link. */
  title?: string
}

/**
 * The matriXO logo as inline SVG. Letters use `currentColor`, so the logo
 * follows the surrounding text colour (ink in light mode, white in dark) with
 * no second image and no theme flash. The blue glow in the O is the only
 * fixed colour, matching the master artwork in /public/brand.
 */
export default function Logo({ variant = 'wordmark', height = 28, className = '', title = 'matriXO' }: LogoProps) {
  const gradientId = `xo-glow-${useId().replace(/:/g, '')}`
  const isMark = variant === 'mark'
  const vbW = isMark ? MARK_VIEWBOX.w : LOGO_VIEWBOX.w
  const vbH = LOGO_VIEWBOX.h
  const cx = isMark ? O_COUNTER.cx - MARK_VIEWBOX.x : O_COUNTER.cx
  const width = Math.round((height * vbW) / vbH)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbW} ${vbH}`}
      width={width}
      height={height}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <radialGradient
          id={gradientId}
          cx={cx}
          cy={O_COUNTER.cy}
          r={1}
          gradientUnits="userSpaceOnUse"
          gradientTransform={`translate(${cx} ${O_COUNTER.cy}) scale(${O_COUNTER.rx} ${O_COUNTER.ry}) translate(${-cx} ${-O_COUNTER.cy})`}
        >
          <stop offset="0" stopColor="#2283C5" stopOpacity="0.96" />
          <stop offset="1" stopColor="#2283C5" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={O_COUNTER.cy} rx={O_COUNTER.rx} ry={O_COUNTER.ry} fill={`url(#${gradientId})`} />
      <path fill="currentColor" fillRule="evenodd" d={isMark ? MARK_PATH : LOGO_PATH} />
    </svg>
  )
}
