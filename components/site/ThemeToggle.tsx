'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Light/dark switch. Both icons are always rendered and CSS picks the visible
 * one from the `.dark` class next-themes sets before paint, so the button
 * never pops in after hydration (that pop was a layout-shift culprit).
 */
export default function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()

  const toggle = () => {
    const isDark = resolvedTheme ? resolvedTheme === 'dark' : document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark appearance"
      title="Appearance"
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center gap-2.5 rounded-full text-ink transition-[background-color,transform] duration-200 hover:bg-ink/[0.06] active:scale-95',
        withLabel ? 'px-3 text-[15px] font-medium' : 'w-10',
        className
      )}
    >
      <Moon aria-hidden="true" className="h-[18px] w-[18px] dark:hidden" strokeWidth={1.8} />
      <Sun aria-hidden="true" className="hidden h-[18px] w-[18px] dark:block" strokeWidth={1.8} />
      {withLabel && (
        <>
          <span className="dark:hidden">Dark appearance</span>
          <span className="hidden dark:inline">Light appearance</span>
        </>
      )}
    </button>
  )
}
