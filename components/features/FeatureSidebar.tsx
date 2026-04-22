'use client'

import { useEffect, useRef, useState, type ReactNode, type ComponentType } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  FaDna,
  FaSeedling,
  FaCertificate,
  FaUserFriends,
  FaChartLine,
  FaUserCircle,
} from 'react-icons/fa'
import FeatureToggleButton from './FeatureToggleButton'

type FeatureItem = {
  id: string
  title: string
  subtitle: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const featureItems: FeatureItem[] = [
  {
    id: 'skilldna',
    title: 'SkillDNA',
    subtitle: 'AI skill genome and persona',
    href: '/skilldna',
    icon: FaDna,
  },
  {
    id: 'growgrid',
    title: 'GrowGrid',
    subtitle: 'Adaptive learning path engine',
    href: '/growgrid',
    icon: FaSeedling,
  },
  {
    id: 'playcred',
    title: 'PlayCred',
    subtitle: 'Verified achievement badges',
    href: '/playcred',
    icon: FaCertificate,
  },
  {
    id: 'mentormatrix',
    title: 'MentorMatrix',
    subtitle: 'AI mentor matching network',
    href: '/mentormatrix',
    icon: FaUserFriends,
  },
  {
    id: 'impactvault',
    title: 'ImpactVault',
    subtitle: 'Skill analytics and insights',
    href: '/impactvault',
    icon: FaChartLine,
  },
  {
    id: 'profile',
    title: 'Profile & Username',
    subtitle: 'Manage your public profile',
    href: '/profile',
    icon: FaUserCircle,
  },
]

export default function FeatureSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    featureItems.forEach((item) => router.prefetch(item.href))
  }, [router])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return

      const clickedToggleButton =
        target instanceof Element && target.closest('[data-feature-toggle-button="true"]')

      if (clickedToggleButton) {
        return
      }

      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNavigate = (href: string) => {
    if (pathname !== href) {
      router.push(href)
    }
    setIsOpen(false)
  }

  return (
    <>
      <FeatureToggleButton isOpen={isOpen} onClick={() => setIsOpen((prev) => !prev)} />

      <aside
        id="feature-sidebar"
        ref={sidebarRef}
        role="navigation"
        aria-label="Feature navigation"
        className={`absolute left-4 top-20 w-72 h-auto z-50 transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
          <div className="p-4 space-y-2">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Features</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigate</h2>
            </div>

            <div className="space-y-2">
              {featureItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.href)}
                    className={`group w-full rounded-2xl border-l-4 px-4 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-blue-500 bg-gradient-to-r from-blue-500/15 via-white/70 to-transparent dark:from-blue-500/20 dark:via-white/10 shadow-[0_0_20px_rgba(59,130,246,0.18)]'
                        : 'border-transparent hover:border-blue-400/60 hover:bg-white/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/50 dark:border-white/10 ${
                          isActive
                            ? 'bg-white/80 text-blue-600 dark:bg-white/10 dark:text-blue-300'
                            : 'bg-white/60 text-gray-700 dark:bg-white/5 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="text-lg" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      {children}
    </>
  )
}
