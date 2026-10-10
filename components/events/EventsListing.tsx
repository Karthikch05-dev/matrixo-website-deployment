'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, ArrowUpRight, CalendarDays, Eye, EyeOff, Lock, Mail, MapPin, Search, X } from 'lucide-react'
import { useEventVisibility } from '@/lib/eventVisibility'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { getValidImageUrl } from '@/lib/imageUtils'
import { firebaseReady } from '@/lib/firebase/client'
import { formatEventDate, formatEventTime, isEventPast } from '@/lib/eventDates'
import type { EventSummary } from '@/lib/events'
import { MARK_PATH, MARK_VIEWBOX, O_COUNTER } from '@/components/brand/logoPaths'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/lib/adsense'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Avatar, SegmentedControl } from '@/components/ui/Controls'
import { Skeleton } from '@/components/ui/Feedback'
import { cn } from '@/lib/cn'
import { GoogleGlyph } from '@/components/brand/GoogleGlyph'

type Filter = 'all' | 'upcoming' | 'past'

export { GoogleGlyph }

function SignInCard() {
  const router = useRouter()
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState<'email' | 'google' | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('email')
    try {
      await signIn(email, password)
      toast.success('Welcome back')
      router.push('/profile')
    } catch (error: any) {
      const code = error?.code
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        toast.error('That email and password don’t match.')
      } else if (code === 'auth/email-not-verified') {
        toast.message('Verify your email first', { description: 'We’ve sent you a new verification link.' })
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Try again in a few minutes.')
      } else {
        toast.error('Couldn’t sign you in. Try again.')
      }
    } finally {
      setBusy(null)
    }
  }

  const handleGoogle = async () => {
    if (!firebaseReady) {
      toast.error('Sign-in is unavailable right now. Please try again later.')
      return
    }
    setBusy('google')
    try {
      const method = await signInWithGoogle()
      if (method === 'redirect') return
      toast.success('Signed in')
      router.push('/profile')
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') return
      toast.error('Google sign-in didn’t work. Try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-[26px] border border-line bg-surface p-6 shadow-raised">
      <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">Sign in</h2>
      <p className="mt-1 text-[14px] text-muted">Register for events and track your tickets.</p>

      <Button variant="secondary" fullWidth className="mt-5" onClick={handleGoogle} loading={busy === 'google'} disabled={busy !== null} leadingIcon={<GoogleGlyph />}>
        Continue with Google
      </Button>

      <div className="my-4 flex items-center gap-3 text-[12px] text-subtle">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleLogin} className="space-y-3" aria-label="Sign in with email">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leadingIcon={<Mail className="h-4 w-4" />}
          required
        />
        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leadingIcon={<Lock className="h-4 w-4" />}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-subtle hover:bg-ink/[0.06] hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          }
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={busy === 'email'} disabled={busy !== null}>
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted">
        New to matriXO?{' '}
        <Link href="/auth?mode=register" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}

function WelcomeCard() {
  const { user } = useAuth()
  const { profile } = useProfile()
  if (!user) return null
  const name = (profile?.fullName || user.displayName || user.email?.split('@')[0] || 'there').trim()
  return (
    <div className="rounded-[26px] border border-line bg-surface p-6 shadow-raised">
      <Avatar name={name} src={profile?.profilePhoto ? getValidImageUrl(profile.profilePhoto) : user.photoURL} size={52} />
      <h2 className="mt-4 text-[19px] font-semibold tracking-[-0.02em] text-ink">Welcome back, {name.split(' ')[0]}</h2>
      <p className="mt-1 truncate text-[14px] text-muted">{user.email}</p>
      <div className="mt-6 grid gap-2">
        <ButtonLink href="/profile" variant="contrast" fullWidth>
          Your profile
        </ButtonLink>
        <ButtonLink href="/notifications" variant="secondary" fullWidth>
          Notifications
        </ButtonLink>
      </div>
    </div>
  )
}

function EventArtwork({ event, priority }: { event: EventSummary; priority: boolean }) {
  if (event.thumbnail) {
    return (
      <Image
        src={event.thumbnail}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 384px"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
    )
  }
  // Branded placeholder for events whose artwork isn't ready yet.
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(120%_90%_at_50%_0%,#123a63_0%,#06070B_60%)] text-white">
      <svg viewBox={`0 0 ${MARK_VIEWBOX.w} ${MARK_VIEWBOX.h}`} className="h-10 w-auto opacity-90" aria-hidden="true">
        <ellipse cx={O_COUNTER.cx - MARK_VIEWBOX.x} cy={O_COUNTER.cy} rx={O_COUNTER.rx} ry={O_COUNTER.ry} fill="#2283C5" opacity="0.8" />
        <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
      </svg>
      <span className="px-6 text-center text-[15px] font-semibold tracking-[-0.01em]">{event.title}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: EventSummary['status'] }) {
  if (status === 'sold-out') return <Badge tone="inverse">Sold out</Badge>
  if (status === 'ended') return <Badge tone="neutral" className="bg-surface/90 backdrop-blur">Ended</Badge>
  return (
    <Badge tone="success" dot className="bg-surface/95 backdrop-blur">
      Upcoming
    </Badge>
  )
}

function Price({ event }: { event: EventSummary }) {
  if (event.status === 'sold-out') return <span className="text-[14px] font-medium text-muted">All tickets claimed</span>
  if (event.status === 'ended') return <span className="text-[14px] font-medium text-muted">See highlights</span>
  if (event.priceFrom === null) return <span className="text-[14px] font-medium text-muted">Details soon</span>
  if (event.priceFrom === 0) return <span className="text-[15px] font-semibold text-ink">Free</span>
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[13px] text-muted">From</span>
      <span className="text-[17px] font-semibold tabular-nums text-ink">₹{event.priceFrom}</span>
      {event.originalPrice && event.originalPrice > event.priceFrom && (
        <span className="text-[13px] tabular-nums text-subtle line-through">₹{event.originalPrice}</span>
      )}
    </span>
  )
}

function EventCard({ event, priority }: { event: EventSummary; priority: boolean }) {
  const tba = /coming soon|tba/i.test(event.location)
  return (
    <Link
      href={event.href}
      target={event.external ? '_blank' : undefined}
      rel={event.external ? 'noopener noreferrer' : undefined}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-canvas-subtle">
        <EventArtwork event={event} priority={priority} />
        <div className="absolute left-3 top-3">
          <StatusBadge status={event.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-subtle">{event.category}</p>
        <h3 className="mt-1.5 text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink">{event.title}</h3>
        {event.tagline && <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-muted">{event.tagline}</p>}
        <dl className="mt-4 space-y-1.5 text-[13px] text-muted">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Date</dt>
            <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-subtle" strokeWidth={1.8} />
            <dd>{tba ? 'Dates announced soon' : `${formatEventDate(event.date)} · ${formatEventTime(event.date)}`}</dd>
          </div>
          {!tba && event.location && (
            <div className="flex items-start gap-2">
              <dt className="sr-only">Location</dt>
              <MapPin aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-subtle" strokeWidth={1.8} />
              <dd className="line-clamp-1">{event.location}</dd>
            </div>
          )}
        </dl>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 [margin-top:max(1.25rem,auto)]">
          <Price event={event} />
          <span className="inline-flex items-center gap-1 text-[14px] font-medium text-accent">
            {event.external ? 'Open' : event.status === 'upcoming' ? 'Get tickets' : 'View'}
            {event.external ? (
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function EventsListing({ events }: { events: EventSummary[] }) {
  const { user, loading: authResolving } = useAuth()
  const { visibilityMap } = useEventVisibility()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [now, setNow] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Restore ?q= so search results can be linked to (and used by agents).
  useEffect(() => {
    setNow(Date.now())
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setQuery(q.slice(0, 80))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      const url = new URL(window.location.href)
      if (query.trim()) url.searchParams.set('q', query.trim())
      else url.searchParams.delete('q')
      window.history.replaceState(window.history.state, '', url.toString())
    }, 300)
    return () => window.clearTimeout(t)
  }, [query])

  // Recompute status in the browser so a cached page never shows a finished
  // event as upcoming.
  const live = useMemo(
    () =>
      events
        .filter((e) => visibilityMap[e.slug]?.hidden !== true)
        .map((e) =>
          now && e.status === 'upcoming' && isEventPast(e.date, now) && !/coming soon|tba/i.test(e.location)
            ? { ...e, status: 'ended' as const }
            : e
        ),
    [events, visibilityMap, now]
  )

  const counts = useMemo(
    () => ({
      all: live.length,
      upcoming: live.filter((e) => e.status === 'upcoming').length,
      past: live.filter((e) => e.status !== 'upcoming').length,
    }),
    [live]
  )

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return live
      .filter((e) => (filter === 'upcoming' ? e.status === 'upcoming' : filter === 'past' ? e.status !== 'upcoming' : true))
      .filter((e) => !q || [e.title, e.tagline, e.location, e.category].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        // Upcoming first (soonest first), then past (most recent first).
        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1
        if (b.status === 'upcoming' && a.status !== 'upcoming') return 1
        const da = new Date(a.date).getTime()
        const db = new Date(b.date).getTime()
        return a.status === 'upcoming' ? da - db : db - da
      })
  }, [live, filter, query])

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_70%_0%,rgb(var(--accent)/0.09),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-site items-center gap-12 px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_360px] lg:gap-16 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="max-w-2xl">
            <p className="eyebrow animate-enter-up">matriXO events</p>
            <h1 className="mt-3 animate-enter-up text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink delay-75ms sm:text-[64px] lg:text-[72px]">
              Explore programs.
            </h1>
            <p className="mt-5 max-w-xl animate-enter-up text-[17px] leading-relaxed text-muted delay-150ms sm:text-[19px]">
              Hands-on workshops, hackathons and talks, run with colleges across India. Find one, sign up in a minute, and spend the day building something real.
            </p>
            <div className="mt-7 flex animate-enter-up flex-wrap items-center gap-x-5 gap-y-3 delay-225ms">
              <Link
                href="/home"
                className="group inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-surface pl-4 pr-3 text-[14px] font-medium text-ink transition-colors hover:bg-canvas-subtle"
              >
                Know more about matriXO
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              {/* Always occupies its line, so the events below never jump when
                  the session resolves (that jump was the page's layout shift). */}
              <Link
                href={user ? '/profile' : '/auth'}
                aria-hidden={authResolving || undefined}
                tabIndex={authResolving ? -1 : undefined}
                className={cn(
                  'text-[14px] font-medium text-accent hover:underline lg:hidden',
                  authResolving && 'invisible'
                )}
              >
                {user ? 'Go to your profile' : 'Sign in to register faster'}
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            {authResolving ? (
              <div className="rounded-[26px] border border-line bg-surface p-6 shadow-raised" aria-busy="true" aria-label="Checking your session">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-2 h-4 w-48" />
                <Skeleton className="mt-6 h-11 w-full rounded-full" />
                <Skeleton className="mt-4 h-11 w-full" />
                <Skeleton className="mt-3 h-11 w-full" />
                <Skeleton className="mt-6 h-11 w-full rounded-full" />
              </div>
            ) : user ? (
              <WelcomeCard />
            ) : (
              <SignInCard />
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="events-heading" className="mx-auto max-w-site px-4 sm:px-6 lg:px-8">
        <h2 id="events-heading" className="sr-only">
          Events
        </h2>
        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="relative w-full sm:max-w-xs"
            // WebMCP declarative hints: lets browser agents call this search as a tool.
            {...{ toolname: 'search_events', tooldescription: 'Search matriXO events by name, topic, college or city.' }}
          >
            <label htmlFor="event-search" className="sr-only">
              Search events
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              ref={searchRef}
              id="event-search"
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, topics, colleges"
              autoComplete="off"
              className="field h-11 w-full rounded-full pl-10 pr-10 text-[15px] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  searchRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-subtle hover:bg-ink/[0.06] hover:text-ink"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </form>
          <SegmentedControl<Filter>
            label="Filter events"
            value={filter}
            onChange={setFilter}
            segments={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
              { value: 'past', label: 'Past', count: counts.past },
            ]}
          />
        </div>

        <p className="mt-4 text-[13px] text-subtle" aria-live="polite">
          {shown.length === 0 ? 'No events match' : `${shown.length} ${shown.length === 1 ? 'event' : 'events'}`}
          {query.trim() && <> for “{query.trim()}”</>}
        </p>

        {shown.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
            <p className="text-[17px] font-semibold text-ink">Nothing here yet</p>
            <p className="mt-1.5 max-w-sm text-[15px] text-muted">
              {query ? 'Try a different word, or clear the search.' : 'New events are announced often. Turn on notifications so you hear first.'}
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              Show all events
            </Button>
          </div>
        ) : (
          <ul className={cn('mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6')}>
            {shown.map((event, i) => (
              <li key={event.id} className="animate-enter-up" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
                <EventCard event={event} priority={i === 0} />
              </li>
            ))}
          </ul>
        )}

        <AdUnit slot={AD_SLOTS.eventsFooter} className="mt-14" minHeight={280} />
      </section>
    </div>
  )
}
