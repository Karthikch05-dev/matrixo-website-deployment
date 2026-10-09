import { MARK_PATH, MARK_VIEWBOX, O_COUNTER } from '@/components/brand/logoPaths'
import { cn } from '@/lib/cn'

type XOLoaderProps = {
  /** Scale factor kept from the old API: the mark renders at roughly 2× this, in px. */
  size?: number
  /** Visible caption under the mark. Omit for a bare loader. */
  label?: string
  className?: string
}

const CX = O_COUNTER.cx - MARK_VIEWBOX.x

/**
 * The matriXO loading mark: the XO monogram from the logo, with the glow in
 * the O breathing while content loads, the same light the logo carries.
 * Pure SVG + CSS (transform/opacity only), so it keeps animating smoothly even
 * while the main thread is busy rendering the next route.
 */
export default function XOLoader({ size = 16, label, className = '' }: XOLoaderProps) {
  const height = Math.round(size * 2)
  const width = Math.round((height * MARK_VIEWBOX.w) / MARK_VIEWBOX.h)

  return (
    <div className={cn('flex flex-col items-center gap-4', className)} role="status" aria-live="polite">
      <svg
        viewBox={`0 0 ${MARK_VIEWBOX.w} ${MARK_VIEWBOX.h}`}
        width={width}
        height={height}
        className="xo-mark text-ink"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="xo-loader-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#2283C5" stopOpacity="1" />
            <stop offset="0.55" stopColor="#2283C5" stopOpacity="0.45" />
            <stop offset="1" stopColor="#2283C5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          className="xo-mark-glow"
          cx={CX}
          cy={O_COUNTER.cy}
          rx={O_COUNTER.rx}
          ry={O_COUNTER.ry}
          fill="url(#xo-loader-glow)"
        />
        <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
      </svg>
      <span aria-hidden="true" className="xo-track" />
      {label ? (
        <p className="text-[13px] font-medium tracking-[-0.01em] text-muted">{label}</p>
      ) : (
        <span className="sr-only">Loading…</span>
      )}
    </div>
  )
}
