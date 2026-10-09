'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

type SheetProps = {
  open: boolean
  onClose: () => void
  /** Accessible title. Rendered visibly unless `hideTitle`. */
  title: string
  hideTitle?: boolean
  /** `bottom` slides up (phones), `right` slides in (tablet/desktop), `full` covers the screen. */
  side?: 'bottom' | 'right' | 'full'
  headerActions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal sheet with focus trap, Escape to close, scroll lock and focus return.
 * Transitions are CSS-only (transform/opacity), so it opens at 60fps without
 * pulling an animation library into the site shell.
 */
export default function Sheet({
  open,
  onClose,
  title,
  hideTitle,
  side = 'bottom',
  headerActions,
  footer,
  children,
  className,
}: SheetProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Mount → next frame → visible, so the enter transition runs. On close,
  // stay mounted until the exit transition ends.
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null
      setMounted(true)
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), 320)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const body = document.body
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.classList.add('scroll-locked')
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      body.classList.remove('scroll-locked')
      body.style.paddingRight = ''
      returnFocus.current?.focus?.()
    }
  }, [open])

  // Move focus into the panel once it is visible.
  useEffect(() => {
    if (!visible || !panelRef.current) return
    const target =
      panelRef.current.querySelector<HTMLElement>('[data-autofocus]') ?? panelRef.current
    target.focus({ preventScroll: true })
  }, [visible])

  if (!mounted || typeof document === 'undefined') return null

  const panelPosition = {
    bottom: 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]',
    right: 'inset-y-0 right-0 w-full max-w-[420px] sm:rounded-l-[28px]',
    full: 'inset-0',
  }[side]

  const hidden = {
    bottom: 'translate-y-full',
    right: 'translate-x-full',
    full: 'opacity-0 scale-[0.985]',
  }[side]

  return createPortal(
    <div className="fixed inset-0 z-[1200]" role="presentation">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col bg-elevated text-ink shadow-overlay outline-none',
          'transition-[transform,opacity] duration-300 ease-out will-change-transform',
          panelPosition,
          visible ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : hidden,
          className
        )}
      >
        {side === 'bottom' && (
          <div aria-hidden="true" className="flex justify-center pb-1 pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-line-strong" />
          </div>
        )}
        <div
          className={cn(
            'flex items-center justify-between gap-3 px-5',
            side === 'bottom' ? 'pb-3 pt-1.5' : 'pb-3 pt-[max(1rem,env(safe-area-inset-top))]',
            hideTitle && 'sr-only'
          )}
        >
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{title}</h2>
          <div className="flex items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06] text-muted transition-colors hover:bg-ink/10 hover:text-ink"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
