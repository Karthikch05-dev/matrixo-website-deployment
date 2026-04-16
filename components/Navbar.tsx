'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaTimes, FaMoon, FaSun, FaChevronDown, FaUser, FaSignOutAlt, FaIdBadge } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import { storeRedirectAfterLogin } from '@/lib/authRedirect'
import { useProfile } from '@/lib/ProfileContext'
import { toast } from 'sonner'
import config from '@/lib/config'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'

const navLinksBeforeFeatures = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Team', href: '/team' },
  { name: 'Services', href: '/services' },
]

const navLinksAfterFeatures = [
  { name: 'Events', href: '/events' },
  { name: 'Contact', href: '/contact' },
]

const navLinks = [...navLinksBeforeFeatures, ...navLinksAfterFeatures]

// Employee Portal URL - external domain
const EMPLOYEE_PORTAL_URL = 'https://team-auth.matrixo.in/employee-portal'

// Beta-only links - matriXO Vision Platform with descriptions
const betaLinks = [
  {
    name: 'SkillDNA™',
    href: '/skilldna',
    description: 'AI-powered skill assessment and genome visualization'
  },
  {
    name: 'GrowGrid™',
    href: '/growgrid',
    description: 'Adaptive learning paths with gamification'
  },
  {
    name: 'PlayCred™',
    href: '/playcred',
    description: 'Blockchain-verified achievement badges'
  },
  {
    name: 'MentorMatrix™',
    href: '/mentormatrix',
    description: 'AI-matched mentorship connections'
  },
  {
    name: 'ImpactVault™',
    href: '/impactvault',
    description: 'Real-time analytics and skill gap insights'
  },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isBeta, setIsBeta] = useState(false)
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false)
  const [showMobileFeaturesDropdown, setShowMobileFeaturesDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)

  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    setIsBeta(window.location.hostname === 'beta.matrixo.in' || window.location.hostname === 'localhost')
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check if user is an employee in Firebase
  useEffect(() => {
    const checkIfEmployee = async () => {
      if (!user?.email) {
        setIsEmployee(false)
        return
      }

      try {
        const db = getFirestore()
        const employeesRef = collection(db, 'Employees')
        const q = query(employeesRef, where('email', '==', user.email))
        const querySnapshot = await getDocs(q)

        setIsEmployee(!querySnapshot.empty)
      } catch (error) {
        console.error('Error checking employee status:', error)
        setIsEmployee(false)
      }
    }

    checkIfEmployee()
  }, [user])

  useEffect(() => {
    if (!mounted) return

    // Check current state from DOM
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [mounted])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }

    setDarkMode(newDarkMode)
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      setShowUserDropdown(false)
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const handleLoginClick = () => {
    storeRedirectAfterLogin()
    setIsOpen(false)
  }

  return (
    <nav
      className="fixed top-0 w-full z-40 transition-all duration-300 ease-in-out"
    >
      <div
        className={`container-custom mx-auto mt-4 sm:mt-5 px-6 sm:px-7 lg:px-8 py-2.5 sm:py-3 max-w-6xl w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] rounded-full border border-gray-200/70 dark:border-white/10 bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-[#0f111a]/75 dark:via-[#0f111a]/70 dark:to-[#0f111a]/75 backdrop-blur-xl transition-all duration-300 ease-in-out relative isolate overflow-visible before:content-[''] before:absolute before:inset-0 before:rounded-full before:blur-2xl before:transition-all before:duration-300 before:opacity-40 dark:before:opacity-60 before:bg-black/10 dark:before:bg-blue-500/20 before:scale-110 before:transform before:pointer-events-none hover:before:opacity-60 dark:hover:before:opacity-70 ${scrolled ? 'shadow-lg' : 'shadow-md'}`}
      >
        <div className="flex items-center justify-between">
          {/* Logo with BETA Badge */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              window.location.reload()
            }}
            className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-10 w-auto"
            >
              {/* Light Mode Logo (Black) */}
              <img
                src="/logos/logo-light.png"
                alt="matriXO Logo"
                className="h-10 w-auto object-contain dark:hidden cursor-pointer"
              />
              {/* Dark Mode Logo (White) */}
              <img
                src="/logos/logo-dark.png"
                alt="matriXO Logo"
                className="h-10 w-auto object-contain hidden dark:block cursor-pointer"
              />
            </motion.div>

            {/* BETA Badge */}
            {isBeta && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full animate-pulse"
              >
                BETA
              </motion.span>
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinksBeforeFeatures.map((link, index) => {
              // Check if active: exact match for home, startsWith for other routes
              const isActive = link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <Link
                    href={link.href}
                    className={`font-medium transition-all duration-300 ease-out relative group ${isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {link.name}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-gray-900 dark:bg-white 
                                   transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`} />
                  </Link>
                </motion.div>
              )
            })}

            {/* Beta Features Dropdown */}
            {isBeta && (
              <div
                className="relative"
                onMouseEnter={() => setShowFeaturesDropdown(true)}
                onMouseLeave={() => setShowFeaturesDropdown(false)}
              >
                <button
                  className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white 
                           font-bold transition-all duration-300 ease-out relative group px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Explore Features
                  <FaChevronDown className={`text-xs transition-transform duration-300 ease-out ${showFeaturesDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showFeaturesDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ 
                        duration: 0.25, 
                        ease: [0.16, 1, 0.3, 1],
                        opacity: { duration: 0.2 }
                      }}
                      className="absolute top-full right-0 mt-2 w-80 overflow-hidden rounded-2xl features-dropdown-glass"
                      style={{
                        background: darkMode
                          ? 'rgba(12, 17, 35, 0.92)'
                          : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(30px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                        border: darkMode
                          ? '1px solid rgba(255, 255, 255, 0.15)'
                          : '1px solid rgba(255, 255, 255, 0.7)',
                        boxShadow: darkMode
                          ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                          : '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {/* Subtle noise texture overlay for premium feel */}
                      <div 
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        }}
                      />
                      {/* Gradient border highlight at top */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
                        style={{
                          background: darkMode
                            ? 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), rgba(168, 85, 247, 0.5), transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3), transparent)',
                        }}
                      />
                      <div className="relative z-10">
                        {betaLinks.map((link, index) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setShowFeaturesDropdown(false)}
                            className={`group block px-6 py-4 transition-all duration-200 border-b relative overflow-hidden ${
                              darkMode
                                ? 'border-white/[0.06] last:border-b-0'
                                : 'border-gray-200/50 last:border-b-0'
                            }`}
                          >
                            {/* Hover glow effect */}
                            <div 
                              className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                darkMode 
                                  ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10' 
                                  : 'bg-gradient-to-r from-indigo-100/50 via-purple-100/50 to-indigo-100/50'
                              }`}
                            />
                            <div className="relative z-10">
                              <div className={`font-bold mb-1 transition-colors duration-200 ${
                                darkMode 
                                  ? 'text-white group-hover:text-indigo-300' 
                                  : 'text-gray-900 group-hover:text-indigo-600'
                              }`}>
                                {link.name}
                              </div>
                              <div className={`text-sm transition-colors duration-200 ${
                                darkMode 
                                  ? 'text-gray-400 group-hover:text-gray-300' 
                                  : 'text-gray-600 group-hover:text-gray-700'
                              }`}>
                                {link.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {navLinksAfterFeatures.map((link, index) => {
              const isActive = link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (navLinksBeforeFeatures.length + index + 1) * 0.05,
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <Link
                    href={link.href}
                    className={`font-medium transition-all duration-300 ease-out relative group ${isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {link.name}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-gray-900 dark:bg-white 
                                   transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`} />
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* Dark Mode Toggle & CTA */}
          <div className="hidden md:flex items-center gap-3">
            {mounted && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="relative p-2.5 rounded-full glass-card-thin text-gray-700 dark:text-gray-300 
                         hover:scale-105 transition-all duration-300 ease-out"
                aria-label="Toggle dark mode"
              >
                <AnimatePresence mode="wait">
                  {darkMode ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -45, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 45, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <FaSun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 45, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -45, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <FaMoon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* User Profile or Login Button */}
            {user ? (
              <div
                className="relative"
                onMouseEnter={() => setShowUserDropdown(true)}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 glass-card-thin text-gray-700 dark:text-gray-300 
                           rounded-full font-semibold hover:scale-[1.02] transition-all duration-300"
                >
                  {profile?.profilePhoto ? (
                    <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={profile.profilePhoto} alt="" width={28} height={28} className="object-cover w-full h-full rounded-xl" unoptimized />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                  )}
                  <span className="hidden sm:inline">{profile?.fullName || user.displayName || user.email?.split('@')[0]}</span>
                </motion.button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute top-full right-0 mt-2 w-56 glass-card-elevated overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-200/30 dark:border-white/[0.06]">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {profile?.fullName || user.displayName || 'User'}
                        </p>
                        {profile?.username && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{profile.username}</p>
                        )}
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="w-full px-4 py-3 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/[0.06] transition-colors border-b border-gray-200/30 dark:border-white/[0.06]"
                      >
                        <FaUser className="text-sm" />
                        <span>Profile</span>
                      </Link>
                      {isEmployee && (
                        <a
                          href={EMPLOYEE_PORTAL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-3 text-left flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:bg-white/40 dark:hover:bg-white/[0.06] transition-colors border-b border-gray-200/30 dark:border-white/[0.06]"
                        >
                          <FaIdBadge />
                          <span>Employee Portal</span>
                        </a>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 ease-out"
                      >
                        <FaSignOutAlt />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link
                  href="/auth"
                  onClick={handleLoginClick}
                  className="inline-flex items-center gap-2 px-4 py-2 glass-card-thin text-gray-700 dark:text-gray-300 
                           rounded-full font-semibold hover:scale-[1.02] transition-all duration-300"
                >
                  <FaUser className="text-sm" />
                  Login
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            {mounted && (
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full glass-card-thin text-gray-700 dark:text-gray-300"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <FaTimes className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              ) : (
                <FaBars className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-3">
                {navLinksBeforeFeatures.map((link) => {
                  // Check if active: exact match for home, startsWith for other routes
                  const isActive = link.href === '/'
                    ? pathname === '/'
                    : pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-2.5 rounded-2xl transition-all duration-200 ease-out ${isActive
                        ? 'bg-blue-500/15 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 font-semibold backdrop-blur-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/[0.06]'
                        }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}

                {/* Mobile Beta Features Accordion */}
                {isBeta && (
                  <div className="border-t border-gray-200/30 dark:border-white/[0.06] pt-3 mt-3">
                    <button
                      onClick={() => setShowMobileFeaturesDropdown(!showMobileFeaturesDropdown)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-gray-700 dark:text-gray-300 
                               font-bold hover:bg-white/40 dark:hover:bg-white/[0.06] rounded-2xl transition-colors"
                    >
                      <span>Explore Features</span>
                      <FaChevronDown className={`text-xs transition-transform duration-200 ${showMobileFeaturesDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showMobileFeaturesDropdown && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-2 pl-4">
                            {betaLinks.map((link) => (
                              <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => {
                                  setIsOpen(false)
                                  setShowMobileFeaturesDropdown(false)
                                }}
                                className="group relative block px-4 py-3 rounded-2xl transition-all duration-200 overflow-hidden"
                                style={{
                                  background: darkMode 
                                    ? 'rgba(255, 255, 255, 0.04)' 
                                    : 'rgba(0, 0, 0, 0.04)',
                                  backdropFilter: 'blur(8px)',
                                  WebkitBackdropFilter: 'blur(8px)',
                                }}
                              >
                                {/* Hover glow effect */}
                                <div 
                                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                    darkMode 
                                      ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10' 
                                      : 'bg-gradient-to-r from-indigo-100/50 via-purple-100/50 to-indigo-100/50'
                                  }`}
                                />
                                <div className="relative z-10">
                                  <div className={`font-bold text-sm mb-1 transition-colors duration-200 ${
                                    darkMode 
                                      ? 'text-white group-hover:text-indigo-300' 
                                      : 'text-gray-900 group-hover:text-indigo-600'
                                  }`}>
                                    {link.name}
                                  </div>
                                  <div className={`text-xs transition-colors duration-200 ${
                                    darkMode 
                                      ? 'text-gray-400 group-hover:text-gray-300' 
                                      : 'text-gray-600 group-hover:text-gray-700'
                                  }`}>
                                    {link.description}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {navLinksAfterFeatures.map((link) => {
                  const isActive = link.href === '/'
                    ? pathname === '/'
                    : pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-2.5 rounded-2xl transition-all duration-200 ease-out ${isActive
                        ? 'bg-blue-500/15 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 font-semibold backdrop-blur-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/[0.06]'
                        }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}

                {/* Mobile CTA Buttons */}
                <div className="border-t border-gray-200/30 dark:border-white/[0.06] pt-3 mt-3 space-y-2">
                  {user ? (
                    <>
                      <div className="px-4 py-3 bg-white/50 dark:bg-white/[0.04] rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                        {profile?.profilePhoto ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                            <Image src={profile.profilePhoto} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {profile?.fullName || user.displayName || 'User'}
                          </p>
                          {profile?.username && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{profile.username}</p>
                          )}
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 glass-card-thin text-gray-700 dark:text-gray-300
                                 rounded-full font-semibold hover:scale-[1.02] transition-all duration-200"
                      >
                        <FaUser className="text-sm" />
                        Profile
                      </Link>
                      {isEmployee && (
                        <a
                          href={EMPLOYEE_PORTAL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-purple-500 text-purple-600 dark:text-purple-400 
                                   rounded-full font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                        >
                          <FaIdBadge className="text-sm" />
                          Employee Portal
                        </a>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-red-500 text-red-600 dark:text-red-400 
                                 rounded-full font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <FaSignOutAlt className="text-sm" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={handleLoginClick}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-purple-500 text-purple-600 dark:text-purple-400 
                               rounded-full font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <FaUser className="text-sm" />
                      Login
                    </Link>
                  )}
                  <Link
                    href="/contact"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center w-full px-6 py-2.5 btn-primary
                             rounded-full font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
