'use client'

import { useEffect } from 'react'

// True once the first page has mounted. Module scope, so it survives the
// template remounting on every navigation.
let hasNavigated = false

/**
 * Route transition: a short fade-and-rise on client-side navigations only.
 * The first page load renders without it so content paints immediately
 * (an opacity-0 start would push back Largest Contentful Paint).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const animate = hasNavigated

  useEffect(() => {
    hasNavigated = true
  }, [])

  return <div className={animate ? 'animate-route-in' : undefined}>{children}</div>
}
