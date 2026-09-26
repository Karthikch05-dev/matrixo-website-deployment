'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { FaCalendar, FaMapMarkerAlt, FaTicketAlt, FaSearch, FaFilter, FaClock, FaStar, FaGoogle, FaEye, FaEyeSlash, FaUser, FaLock, FaSpinner } from 'react-icons/fa'
import eventsData from '@/data/events.json'
import HeadingHighlight from '@/components/HeadingHighlight'
import { useEventVisibility } from '@/lib/eventVisibility'
import { format, isFuture, isPast, compareDesc, compareAsc } from 'date-fns'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { getValidImageUrl } from '@/lib/imageUtils'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/lib/adsense'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { firebaseReady } from '@/lib/firebaseConfig'
import XOLoader from '@/components/XOLoader'

type SortOption = 'upcoming' | 'latest' | 'all'

export default function EventsListing() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortOption, setSortOption] = useState<SortOption>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { visibilityMap, loading: visibilityLoading } = useEventVisibility()

  // Auth State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  // `authResolving` is true until Firebase reports the current session. The card
  // shows a placeholder until then so a signed-in visitor never sees the
  // logged-out form flash past.
  const { user, loading: authResolving, signIn, signInWithGoogle } = useAuth()
  const { profile } = useProfile()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      router.push('/profile')
    } catch (error: any) {
      console.error('Login error:', error)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password')
      } else {
        toast.error(error.message || 'Login failed')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      if (!firebaseReady) {
        toast.error('Authentication is not configured. Please try again later.')
        return
      }
      const signInMethod = await signInWithGoogle()
      if (signInMethod === 'redirect') return
      toast.success('Signed in successfully!')
      router.push('/profile')
    } catch (error: any) {
      console.error('Google Auth Error:', error)
      const code = error?.code || 'unknown'
      if (code === 'auth/popup-closed-by-user') {
        toast.info('Sign-in cancelled')
      } else {
        toast.error('Google sign-in failed. Please try again.')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const filteredAndSortedEvents = useMemo(() => {
    // 1. Base dataset filter: Only keep Event programs
    const eventPrograms = eventsData.filter(event => {
      const cat = event.category?.toLowerCase() || ''
      const tags = event.tags?.map((t: string) => t.toLowerCase()) || []

      // Allow specific examples cited by user (DevAgentic is an event despite 'workshop' category)
      if (event.id === 'devagents-1-0' || event.id === 'devagentic-2-0') return true

      // Exclude non-event types explicitly forbidden by user
      const nonEventKeywords = ['workshop', 'hackathon', 'course', 'bootcamp', 'webinar', 'competition']
      const hasNonEventKeyword = nonEventKeywords.some(kw => cat.includes(kw) || tags.some(t => t.includes(kw)))
      if (hasNonEventKeyword) return false

      return true
    })

    // 2. Apply user-selected filters to the Event dataset
    let filtered = eventPrograms.filter(event => {
      const isHidden = visibilityMap[event.slug]?.hidden === true
      if (isHidden) return false

      const cat = categoryFilter.toLowerCase()
      // Since page is Events-only, "Events" and "All Programs" chips both show all events.
      // Other chips (e.g. workshops) will return 0 results since they were stripped in step 1.
      const isEventFilter = cat === 'event' || cat === 'all'
      const matchesCategory = isEventFilter ||
        (event.category?.toLowerCase().includes(cat)) ||
        (event.tags?.some((t: string) => t.toLowerCase().includes(cat))) || false

      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm ||
        (event.title?.toLowerCase().includes(searchLower)) ||
        (event.tagline?.toLowerCase().includes(searchLower)) ||
        (event.location?.toLowerCase().includes(searchLower)) || false
      return matchesCategory && matchesSearch
    })

    // Sort based on selected option
    if (sortOption === 'upcoming') {
      filtered = filtered
        .filter(event => event.status === 'upcoming' || isFuture(new Date(event.date)))
        .sort((a, b) => compareAsc(new Date(a.date), new Date(b.date)))
    } else if (sortOption === 'latest') {
      filtered = filtered.sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    }

    return filtered
  }, [categoryFilter, sortOption, searchTerm, visibilityMap])

  const activeFilterClass =
    'bg-[#4B5563] text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:bg-[#2F3542] dark:bg-white dark:text-[#111111] dark:shadow-[0_2px_8px_rgba(255,255,255,0.08)] dark:hover:bg-[#F3F3F3]'

  return (
    <div className="min-h-screen pt-0 pb-16">
      {/* Header */}
      <section className="relative bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-blue-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-black pt-20 pb-8 sm:pt-[104px] sm:pb-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-300/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-300/10 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container-custom px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center max-w-[1050px] mx-auto gap-12 lg:gap-8">
            {/* Left: Content */}
            {/* CSS-driven enter animation (same motion as before) so the LCP
                heading paints immediately instead of after hydration. */}
            <div className="text-left flex-1 max-w-[500px] animate-enter-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                <HeadingHighlight text="Explore Programs" />
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Workshops, hackathons, bootcamps, and technical events designed to accelerate your tech career
              </p>
            </div>

            {/* Right: Login Card */}
            <div className="w-full max-w-[320px] lg:mr-8 shrink-0 animate-enter-right">
              {/* While the session is still resolving the real card is rendered but
                  hidden, so it reserves its exact final height (no layout shift) and
                  a signed-in visitor never sees the logged-out form flash past. */}
              <div className="relative">
                <div className={authResolving ? 'invisible' : undefined} aria-hidden={authResolving || undefined}>
                  {!user ? (
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-6">
                      <div className="mb-5">
                        <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Student Login</h2>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-3.5">
                        <div className="relative">
                          <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]" />
                          <input
                            type="email"
                            placeholder="Email or College ID"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-[13px]"
                            required
                          />
                        </div>
                        <div className="relative">
                          <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px]" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-[13px]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPassword ? <FaEyeSlash size={14} aria-hidden="true" /> : <FaEye size={14} aria-hidden="true" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[12px] pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span>Remember me</span>
                          </label>
                          <Link href="/forgot-password" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            Forgot password?
                          </Link>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-2.5 mt-1 rounded-xl font-medium text-[14px] disabled:opacity-70 cta-glass"
                        >
                          {authLoading ? 'Logging in...' : 'Login'}
                        </button>
                      </form>

                      <div className="flex items-center gap-3 my-4">
                        <div className="h-px bg-gray-100 dark:bg-gray-700 flex-1" />
                        <span className="text-[11px] text-gray-400 font-medium lowercase">or</span>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 flex-1" />
                      </div>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={authLoading}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors text-[13px] disabled:opacity-70 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                      >
                        <FaGoogle className="text-[14px]" />
                        Sign in with Google
                      </button>

                      <div className="mt-5 text-center text-[12px] text-gray-600 dark:text-gray-400">
                        New here?{' '}
                        <Link href="/auth?mode=register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                          Register now
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 text-center flex flex-col items-center justify-center min-h-[280px]">
                      {/* Same photo the profile page shows. Falls back to the
                          initial while the profile loads, or if none is set. */}
                      {profile?.profilePhoto ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden mb-3 mx-auto">
                          <Image
                            src={getValidImageUrl(profile.profilePhoto)}
                            alt=""
                            width={56}
                            height={56}
                            className="object-cover w-full h-full rounded-full"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-3 mx-auto">
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {profile?.fullName?.charAt(0)?.toUpperCase() || user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Welcome back!</h3>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5 truncate max-w-full px-2">You are logged in as {user.email}</p>
                      <Link
                        href="/profile"
                        className="px-6 py-2 rounded-xl font-medium text-[13px] cta-glass"
                      >
                        Go to Profile
                      </Link>
                    </div>
                  )}
                </div>
                {authResolving && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    role="status"
                    aria-label="Checking your session"
                  >
                    <XOLoader size={16} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search - Compact Version */}
      <section className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-md py-3 sm:py-4 border-b border-gray-200/30 dark:border-white/[0.06]">
        <div className="container-custom px-4 sm:px-6">
          {/* Compact Filter Row */}
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            {/* Search - Compact */}
            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                aria-label="Search events"
                placeholder="Search programs, topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full glass-input text-sm"
              />
            </div>

            {/* Sort Options - Compact */}
            <div className="flex items-center gap-2 flex-wrap">
              <FaClock className="text-gray-500 text-sm" />
              {[
                { value: 'upcoming', label: 'Upcoming', icon: FaClock },
                { value: 'latest', label: 'Latest', icon: FaStar },
                { value: 'all', label: 'All', icon: FaCalendar }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortOption(option.value as SortOption)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex items-center gap-1.5 ${sortOption === option.value
                      ? activeFilterClass
                      : 'glass-chip text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <option.icon className="text-xs" />
                  {option.label}
                </button>
              ))}
            </div>

            {/* Category Filter Buttons - Compact */}
            <div className="flex items-center gap-2 flex-wrap">
              <FaFilter className="text-gray-500 text-sm" />
              {[
                { value: 'all', label: 'All Programs' },
                { value: 'course', label: 'Courses' },
                { value: 'workshop', label: 'Workshops' },
                { value: 'hackathon', label: 'Hackathons' },
                { value: 'bootcamp', label: 'Bootcamps' },
                { value: 'event', label: 'Events' }
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${categoryFilter === cat.value
                      ? activeFilterClass
                      : 'glass-chip text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSortedEvents.length}</span> program{filteredAndSortedEvents.length !== 1 ? 's' : ''}
            {visibilityLoading && <span className="ml-2 text-xs text-gray-500">Checking visibility…</span>}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="section-padding bg-transparent">
        <div className="container-custom px-4 sm:px-6">
          {filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">No programs found matching your criteria</p>
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setSortOption('all')
                  setSearchTerm('')
                }}
                className={`mt-4 px-6 py-3 rounded-full transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${activeFilterClass}`}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {filteredAndSortedEvents.map((event, index) => {
                const eventLink = (event as any).externalLink || `/events/${event.slug}`
                const isExternal = !!(event as any).externalLink

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{
                      // Cap the stagger: with `index * 0.05` uncapped, the 30th
                      // card waited 1.5s and the grid trickled in. Capping at 7
                      // keeps the cascade visible but never longer than ~350ms,
                      // including when a filter change re-runs it.
                      delay: Math.min(index, 7) * 0.05,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={eventLink}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                    >
                      <div className="group glass-card overflow-hidden
                                    transition-all duration-200 hover:-translate-y-2 border-2 border-transparent 
                                    hover:border-blue-500/30 h-full flex flex-col">
                        {/* Image */}
                        <div className={`relative h-40 sm:h-44 md:h-48 overflow-hidden ${event.id === 'devagentic-2-0' ? 'bg-transparent' : 'bg-gradient-to-br from-blue-500/20 to-purple-600/20'}`}>
                          {event.images?.thumbnail ? (
                            <Image
                              src={event.images.thumbnail}
                              alt={event.title}
                              fill
                              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                              className="object-cover object-center"
                            />
                          ) : (
                            event.id !== 'devagentic-2-0' && (
                              <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold gradient-text">
                                {event.title.charAt(0)}
                              </div>
                            )
                          )}
                          {event.featured && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              FEATURED
                            </div>
                          )}
                          {event.status === 'sold-out' && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-celebrate animate-shine">
                              🎉 SOLD OUT 🎊
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {event.category.toUpperCase()}
                          </div>
                          {isFuture(new Date(event.date)) && event.status !== 'sold-out' && event.status !== 'completed' && (
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              UPCOMING
                            </div>
                          )}
                          {event.status === 'completed' && (
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-gray-500 to-slate-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              EVENT COMPLETED
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
                          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white transition-all duration-200 line-clamp-2">
                            <HeadingHighlight text={event.title} />
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
                            {event.tagline}
                          </p>

                          {/* Details */}
                          <div className="space-y-2 mb-4 flex-1">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <FaCalendar className="mr-2 text-blue-500 flex-shrink-0" />
                              {format(new Date(event.date), 'MMM dd, yyyy • hh:mm a')}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <FaMapMarkerAlt className="mr-2 text-purple-600 flex-shrink-0" />
                              {event.location}
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="flex items-center justify-between">
                            {event.status === 'sold-out' ? (
                              <div className="w-full">
                                <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border-2 border-red-500 rounded-xl p-4 text-center">
                                  <span className="text-3xl mb-2 block">🎉</span>
                                  <span className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                                    SOLD OUT!
                                  </span>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    🎊 All tickets claimed! 🎊
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  {(event as any).googleFormLink ? (
                                    <span className="text-xl sm:text-2xl font-bold gradient-text">Free</span>
                                  ) : (
                                    <>
                                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">From</span>
                                      <div className="flex items-baseline gap-1 sm:gap-2">
                                        <span className="text-xl sm:text-2xl font-bold gradient-text">
                                          ₹{Math.min(...event.tickets.map((t: any) => t.price))}
                                        </span>
                                        {event.tickets.some((t: any) => t.originalPrice) && (
                                          <span className="text-xs sm:text-sm text-gray-400 line-through">
                                            ₹{(event.tickets.find((t: any) => t.originalPrice) as any)?.originalPrice}
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex items-center space-x-1.5 sm:space-x-2 cta-glass
                                           px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm"
                                >
                                  <FaTicketAlt className="text-xs sm:text-sm" />
                                  <span>Book</span>
                                </motion.button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Renders nothing until NEXT_PUBLIC_ADSENSE_SLOT_EVENTS_FOOTER is set. */}
          <AdUnit
            slot={AD_SLOTS.eventsFooter}
            className="mt-10 sm:mt-14"
            minHeight={280}
          />
        </div>
      </section>
    </div>
  )
}
