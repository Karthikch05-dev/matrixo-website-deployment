import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Shimmering placeholder that holds the exact space of content still loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />
}

/** Friendly empty or zero state, with an optional action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas-subtle text-[20px] text-subtle">
          {icon}
        </div>
      )}
      <p className="text-[17px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Inline notice for info, success, warning and error messages. */
export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger'
  title?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const tones = {
    info: 'bg-accent-soft border-accent/15 text-ink',
    success: 'bg-success/10 border-success/20 text-ink',
    warning: 'bg-warning/10 border-warning/25 text-ink',
    danger: 'bg-danger/10 border-danger/20 text-ink',
  }
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-2xl border px-4 py-3 text-[14px] leading-relaxed', tones[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-0.5', 'text-muted')}>{children}</div>}
    </div>
  )
}
