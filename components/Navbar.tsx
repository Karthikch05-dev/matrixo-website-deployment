'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaTimes, FaMoon, FaSun, FaChevronDown, FaUser, FaSignOutAlt, FaIdBadge } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'
import { useProfile } from '@/lib/ProfileContext'
import { toast } from 'sonner'
import config from '@/lib/config'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Events', href: '/events' },
  { name: 'Services', href: '/services' },
  { name: 'About', href: '/about' },
  { name: 'Team', href: '/team' },
  { name: 'Contact', href: '/contact' },
  { name: 'Careers', href: '/careers' },
]

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
    setIsBeta(window.location.hostname === 'beta.matrixo.in')
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

  return (
    <nav
      className={`fixed top-0 w-full z-40 transition-all duration-300 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl shadow-lg border-b border-gray-200/20 dark:border-gray-700/20`}
    >
      <div className="container-custom px-4 sm:px-6 py-3">
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
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link, index) => {
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
                    className={`font-medium transition-all duration-300 ease-out relative group ${
                      isActive 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
                    }`}
                  >
                    {link.name}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 
                                   transition-all duration-300 ease-out ${
                                     isActive ? 'w-full' : 'w-0 group-hover:w-full'
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
                  className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 
                           font-bold transition-all duration-300 ease-out relative group px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  Features
                  <FaChevronDown className={`text-xs transition-transform duration-300 ease-out ${showFeaturesDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showFeaturesDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {betaLinks.map((link, index) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block px-6 py-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {link.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {link.description}
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle & CTA */}
          <div className="hidden md:flex items-center gap-3">
            {mounted && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                         hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 ease-out"
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
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-purple-500 text-purple-600 dark:text-purple-400 
                           rounded-full font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                >
                  <FaUser className="text-sm" />
                  {profile?.fullName || user.displayName || user.email?.split('@')[0]}
                </motion.button>
                
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {profile?.fullName || user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="w-full px-4 py-3 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700"
                      >
                        <FaUser className="text-sm" />
                        <span>Profile</span>
                      </Link>
                      {isEmployee && (
                        <a
                          href={EMPLOYEE_PORTAL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-3 text-left flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-200 dark:border-gray-700"
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
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-purple-500 text-purple-600 dark:text-purple-400 
                           rounded-full font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 ease-out"
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
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                {navLinks.map((link) => {
                  // Check if active: exact match for home, startsWith for other routes
                  const isActive = link.href === '/' 
                    ? pathname === '/'
                    : pathname === link.href || pathname.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-2 rounded-lg transition-all duration-200 ease-out ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}

                {/* Mobile Beta Features Accordion */}
                {isBeta && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <button
                      onClick={() => setShowMobileFeaturesDropdown(!showMobileFeaturesDropdown)}
                      className="w-full flex items-center justify-between px-4 py-2 text-purple-600 dark:text-purple-400 
                               font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                      <span>Features</span>
                      <FaChevronDown className={`text-xs transition-transform duration-200 ${showMobileFeaturesDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showMobileFeaturesDropdown && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
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
                                className="block px-4 py-3 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 
                                         rounded-lg transition-colors"
                              >
                                <div className="font-bold text-purple-600 dark:text-purple-400 text-sm mb-1">
                                  {link.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {link.description}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Mobile CTA Buttons */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 space-y-2">
                  {user ? (
                    <>
                      <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {profile?.fullName || user.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300
                                 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
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
                      onClick={() => setIsOpen(false)}
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
                    className="flex items-center justify-center w-full px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 
                             text-white rounded-full font-semibold hover:shadow-lg transition-all duration-200"
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
