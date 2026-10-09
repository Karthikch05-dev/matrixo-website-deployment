'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Thin progress bar at the top of the viewport for client-side navigations.
 * The App Router has no route-change events, so it starts on clicks of
 * same-origin links and completes when the URL actually changes.
 */
export default function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const timers = useRef<number[]>([])

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  // Complete whenever the route changes.
  useEffect(() => {
    if (state !== 'loading') return
    clear()
    setProgress(1)
    setState('done')
    timers.current.push(window.setTimeout(() => {
      setState('idle')
      setProgress(0)
    }, 350))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  useEffect(() => {
    const start = () => {
      clear()
      setState('loading')
      setProgress(0.12)
      // Trickle towards 90% so a slow route still shows movement.
      const steps = [0.3, 0.5, 0.65, 0.76, 0.84, 0.9]
      steps.forEach((value, i) => {
        timers.current.push(window.setTimeout(() => setProgress(value), 180 + i * 380))
      })
      // Never hang: give up quietly after 12s.
      timers.current.push(window.setTimeout(() => {
        setState('idle')
        setProgress(0)
      }, 12000))
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      start()
    }

    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      clear()
    }
  }, [])

  if (state === 'idle') return null

  return (
    <div
      aria-hidden="true"
      className="route-progress"
      style={{
        transform: `scaleX(${progress})`,
        opacity: state === 'done' ? 0 : 1,
        transition: `transform ${state === 'done' ? 200 : 400}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease ${state === 'done' ? '150ms' : '0ms'}`,
      }}
    />
  )
}
