import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'inverse'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-canvas-subtle text-muted border-line',
  accent: 'bg-accent-soft text-accent border-accent/15',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  inverse: 'bg-ink text-canvas border-transparent',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot = false,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  /** Leading status dot. */
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-medium leading-5',
        tones[tone],
        className
      )}
    >
      {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export default Badge
