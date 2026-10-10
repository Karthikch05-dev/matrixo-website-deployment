'use client'

import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Round icon-only button. Always needs an accessible label. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: 'sm' | 'md'; variant?: 'plain' | 'outline' }
>(function IconButton({ label, size = 'md', variant = 'plain', className, children, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full text-ink transition-[background-color,transform] duration-200 ease-out active:scale-95',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        variant === 'outline' ? 'border border-line bg-surface hover:bg-canvas-subtle' : 'hover:bg-ink/[0.06]',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
})

type Segment<T extends string> = { value: T; label: ReactNode; count?: number }

/**
 * iOS-style segmented control for filters and tabs. Renders a radiogroup so
 * arrow keys and screen readers behave like native segmented controls.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  className,
  size = 'md',
}: {
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const name = useId()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-canvas-subtle p-1 no-scrollbar dark:bg-surface', className)}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        e.preventDefault()
        const i = segments.findIndex((s) => s.value === value)
        const next = segments[(i + (e.key === 'ArrowRight' ? 1 : segments.length - 1)) % segments.length]
        onChange(next.value)
        const el = (e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)
        el?.focus()
      }}
    >
      {segments.map((segment) => {
        const active = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            role="radio"
            name={name}
            data-value={segment.value}
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(segment.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-[background-color,color,box-shadow] duration-200',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-4 text-[14px]',
              active ? 'bg-surface text-ink shadow-[0_1px_3px_rgb(0_0_0/0.1)] dark:bg-elevated' : 'text-muted hover:text-ink'
            )}
          >
            {segment.label}
            {typeof segment.count === 'number' && (
              <span className={cn('tabular-nums text-[12px]', active ? 'text-muted' : 'text-subtle')}>{segment.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Initials avatar with optional photo. */
export function Avatar({
  name,
  src,
  size = 32,
  className,
}: {
  name?: string | null
  src?: string | null
  size?: number
  className?: string
}) {
  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-canvas-subtle font-semibold text-muted ring-1 ring-line', className)}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size} height={size} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </span>
  )
}
