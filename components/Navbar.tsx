'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowUpRight, ChevronDown, LogOut, UserRound, Bell, LayoutGrid, IdCard } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import ThemeToggle from '@/components/site/ThemeToggle'
import NotificationCenter from '@/components/site/NotificationCenter'
import { Avatar } from '@/components/ui/Controls'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { getValidImageUrl } from '@/lib/imageUtils'
import { BETA_PRODUCTS_ENABLED } from '@/lib/site'
import { COMPANY_NAV, LABS_NAV, PRIMARY_NAV, isActive, type NavGroup } from '@/lib/navigation'
import { cn } from '@/lib/cn'

const EMPLOYEE_PORTAL_URL = 'https://team-auth.matrixo.in/employee-portal'

/** Shared open/close behaviour for header popovers: outside click, Escape, route change. */
function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        ;(ref.current?.querySelector('button') as HTMLButtonElement | null)?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, ref }
}

function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const { open, setOpen, ref } = usePopover()
  const panelId = useId()
  const closeTimer = useRef<number>()
  const active = group.items.some((item) => isActive(item, pathname))

  const hoverOpen = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hoverClose = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  return (
    <div ref={ref} className="relative" onPointerEnter={(e) => e.pointerType === 'mouse' && hoverOpen()} onPointerLeave={(e) => e.pointerType === 'mouse' && hoverClose()}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={cn('nav-link gap-1', active && 'nav-link-active')}
      >
        {group.label}
        <ChevronDown aria-hidden="true" className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')} strokeWidth={2} />
      </button>
      {open && (
        <div id={panelId} className="absolute left-1/2 top-[calc(100%+12px)] z-[1100] w-[300px] -translate-x-1/2 animate-scale-in rounded-[20px] border border-line bg-elevated p-2 shadow-overlay">
          <ul>
            {group.items.map((item) => {
              const current = isActive(item, pathname)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'block rounded-[14px] px-3.5 py-2.5 transition-colors hover:bg-ink/[0.04]',
                      current && 'bg-ink/[0.04]'
                    )}
                  >
                    <span className="block text-[14px] font-medium text-ink">{item.label}</span>
                    {item.description && <span className="mt-0.5 block text-[13px] text-muted">{item.description}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function useIsEmployee(email: string | null | undefined) {
  const [isEmployee, setIsEmployee] = useState(false)
  useEffect(() => {
    if (!email) {
      setIsEmployee(false)
      return
    }
    let cancelled = false
    // Firestore loads on demand, only for signed-in visitors, after the page settles.
    const t = window.setTimeout(async () => {
      try {
        const { db, collection, query, where, getDocs, limit } = await (await import('@/lib/firebase/lazyFirestore')).loadFirestore()
        const snap = await getDocs(query(collection(db, 'Employees'), where('email', '==', email), limit(1)))
        if (!cancelled) setIsEmployee(!snap.empty)
      } catch {
        if (!cancelled) setIsEmployee(false)
      }
    }, 1500)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [email])
  return isEmployee
}

function AccountMenu() {
  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const { open, setOpen, ref } = usePopover()
  const isEmployee = useIsEmployee(user?.email)

  if (!user) return null

  const name = (profile?.fullName || user.displayName || user.email?.split('@')[0] || 'Account').trim()
  const photo = profile?.profilePhoto ? getValidImageUrl(profile.profilePhoto) : user.photoURL

  const signOut = async () => {
    setOpen(false)
    try {
      await logout()
      toast.success('Signed out')
    } catch {
      toast.error('Couldn’t sign out. Try again.')
    }
  }

  const item = 'flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] text-ink transition-colors hover:bg-ink/[0.05]'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${name}`}
        className="flex h-10 items-center gap-2 rounded-full pl-1 pr-1 transition-colors hover:bg-ink/[0.06] lg:pr-3"
      >
        <Avatar name={name} src={photo} size={30} />
        <span className="hidden max-w-[120px] truncate text-[14px] font-medium text-ink lg:block">{name.split(' ')[0]}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-[1100] w-[280px] animate-scale-in rounded-[20px] border border-line bg-elevated p-2 shadow-overlay">
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <Avatar name={name} src={photo} size={40} />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
              <p className="truncate text-[13px] text-muted">{profile?.username ? `@${profile.username}` : user.email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" href="/profile" className={item}>
            <UserRound aria-hidden="true" className="h-[18px] w-[18px] text-muted" strokeWidth={1.8} />
            Your profile
          </Link>
          {BETA_PRODUCTS_ENABLED && (
            <Link role="menuitem" href="/dashboard" className={item}>
              <LayoutGrid aria-hidden="true" className="h-[18px] w-[18px] text-muted" strokeWidth={1.8} />
              Dashboard
            </Link>
          )}
          <Link role="menuitem" href="/notifications" className={item}>
            <Bell aria-hidden="true" className="h-[18px] w-[18px] text-muted" strokeWidth={1.8} />
            Notifications
          </Link>
          {isEmployee && (
            <a role="menuitem" href={EMPLOYEE_PORTAL_URL} target="_blank" rel="noopener noreferrer" className={item}>
              <IdCard aria-hidden="true" className="h-[18px] w-[18px] text-muted" strokeWidth={1.8} />
              <span className="flex-1">Employee portal</span>
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-subtle" />
            </a>
          )}
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" type="button" onClick={signOut} className={cn(item, 'text-danger')}>
            <LogOut aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function MobileMenu({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const isEmployee = useIsEmployee(open ? user?.email : null)
  const panelRef = useRef<HTMLDivElement>(null)

  // `inert` keeps the closed menu out of the tab order. React 18 doesn't pass
  // the attribute through, so set the DOM property directly.
  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !open
  }, [open])

  useEffect(() => {
    if (!open) return
    document.body.classList.add('scroll-locked')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector<HTMLElement>('a,button')?.focus({ preventScroll: true })
    return () => {
      document.body.classList.remove('scroll-locked')
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const groups: NavGroup[] = [{ label: 'Explore', items: PRIMARY_NAV }, COMPANY_NAV, ...(LABS_NAV ? [LABS_NAV] : [])]
  const name = (profile?.fullName || user?.displayName || user?.email?.split('@')[0] || '').trim()

  return (
    <div
      id="mobile-menu"
      ref={panelRef}
      aria-hidden={!open}
      className={cn(
        'fixed inset-x-0 bottom-0 top-[var(--nav-height)] z-[1090] overflow-y-auto overscroll-contain bg-canvas lg:hidden',
        'transition-[opacity,visibility] duration-300 ease-out',
        open ? 'visible opacity-100' : 'invisible opacity-0'
      )}
    >
      <nav aria-label="Mobile" className="mx-auto max-w-site px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        {groups.map((group, gi) => (
          <div key={group.label} className="mb-6">
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-subtle">{group.label}</p>
            <ul>
              {group.items.map((item, i) => {
                const current = isActive(item, pathname)
                return (
                  <li
                    key={item.href}
                    style={{ transitionDelay: open ? `${(gi * 3 + i) * 25}ms` : '0ms' }}
                    className={cn('transition-[opacity,transform] duration-300 ease-out', open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0')}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'flex min-h-[48px] items-center justify-between border-b border-line text-[22px] font-semibold tracking-[-0.02em]',
                        current ? 'text-ink' : 'text-ink/85'
                      )}
                    >
                      {item.label}
                      {current && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        <div className="space-y-3 pt-2">
          {user ? (
            <>
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3 rounded-2xl bg-canvas-subtle p-3 dark:bg-surface">
                <Avatar name={name} src={profile?.profilePhoto ? getValidImageUrl(profile.profilePhoto) : user.photoURL} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold text-ink">{name || 'Your profile'}</span>
                  <span className="block truncate text-[14px] text-muted">{profile?.username ? `@${profile.username}` : 'View your profile'}</span>
                </span>
              </Link>
              {isEmployee && (
                <a href={EMPLOYEE_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong text-[15px] font-medium text-ink">
                  Employee portal <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={async () => {
                  onClose()
                  await logout()
                  toast.success('Signed out')
                }}
                className="flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium text-danger hover:bg-danger/10"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth" onClick={onClose} className="flex h-12 items-center justify-center rounded-full border border-line-strong text-[15px] font-medium text-ink">
              Sign in
            </Link>
          )}
          <Link href="/contact" onClick={onClose} className="flex h-12 items-center justify-center rounded-full bg-ink text-[15px] font-medium text-canvas">
            Talk to us
          </Link>
          <div className="flex justify-center pt-2">
            <ThemeToggle withLabel />
          </div>
        </div>
      </nav>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname() || '/'
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 4))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[1300] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[14px] focus:text-canvas"
      >
        Skip to content
      </a>
      <header
        data-site-chrome
        className={cn(
          'fixed inset-x-0 top-0 z-[1100] h-[var(--nav-height)] pt-[env(safe-area-inset-top)] transition-[background-color,border-color,box-shadow] duration-300',
          'border-b',
          scrolled || menuOpen
            ? 'border-line bg-canvas/80 backdrop-blur-xl backdrop-saturate-150'
            : 'border-transparent bg-canvas/0'
        )}
      >
        <div className="mx-auto flex h-full max-w-site items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="matriXO home" className="-ml-1 flex shrink-0 items-center rounded-lg px-1 py-1 text-ink">
            <Logo height={24} title="" className="sm:h-[26px] sm:w-auto" />
          </Link>
          {BETA_PRODUCTS_ENABLED && (
            <span
              title="You’re on the beta site — features here are still being tested"
              className="ml-1 inline-flex h-[22px] items-center rounded-full border border-accent/25 bg-accent-soft px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent"
            >
              Beta
            </span>
          )}

          <nav aria-label="Main" className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {PRIMARY_NAV.map((link) => {
              const current = isActive(link, pathname)
              return (
                <Link key={link.href} href={link.href} aria-current={current ? 'page' : undefined} className={cn('nav-link', current && 'nav-link-active')}>
                  {link.label}
                </Link>
              )
            })}
            <NavDropdown group={COMPANY_NAV} pathname={pathname} />
            {LABS_NAV && <NavDropdown group={LABS_NAV} pathname={pathname} />}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <ThemeToggle className="hidden sm:inline-flex" />
            <NotificationCenter />
            <div className="hidden min-w-[72px] justify-end lg:flex">
              {user ? (
                <AccountMenu />
              ) : (
                <Link
                  href="/auth"
                  className={cn('inline-flex h-10 items-center rounded-full px-4 text-[14px] font-medium text-ink transition-[background-color,opacity] hover:bg-ink/[0.06]', loading && 'opacity-0')}
                  aria-hidden={loading || undefined}
                  tabIndex={loading ? -1 : undefined}
                >
                  Sign in
                </Link>
              )}
            </div>
            <Link href="/contact" className="ml-1 hidden h-9 items-center rounded-full bg-ink px-4 text-[14px] font-medium text-canvas transition-opacity hover:opacity-85 lg:inline-flex">
              Talk to us
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="relative -mr-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.06] lg:hidden"
            >
              <span aria-hidden="true" className="relative block h-3 w-[18px]">
                <span className={cn('absolute left-0 block h-[1.6px] w-full rounded-full bg-current transition-transform duration-300 ease-out', menuOpen ? 'top-[5px] rotate-45' : 'top-0')} />
                <span className={cn('absolute left-0 block h-[1.6px] w-full rounded-full bg-current transition-transform duration-300 ease-out', menuOpen ? 'top-[5px] -rotate-45' : 'top-[10px]')} />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={closeMenu} pathname={pathname} />
    </>
  )
}
