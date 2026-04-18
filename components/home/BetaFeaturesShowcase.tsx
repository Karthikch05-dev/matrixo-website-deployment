'use client'

import { memo, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

const betaFeatures = [
  {
    id: 'skilldna',
    name: 'SkillDNA™',
    href: '/skilldna',
    description: 'AI-powered skill assessment and genome visualization',
    details:
      'Discover your unique skill genome through AI-powered assessment. Our advanced algorithms analyze your technical abilities, learning patterns, and growth trajectory to create a visual DNA map of your capabilities. Understand your strengths, identify gaps, and get personalized recommendations.',
    gradient: 'from-purple-500 to-fuchsia-500',
    icon: '🧬',
  },
  {
    id: 'growgrid',
    name: 'GrowGrid™',
    href: '/growgrid',
    description: 'Adaptive learning paths with gamification',
    details:
      'Navigate your learning journey with adaptive pathways that evolve with you. Earn XP, unlock achievements, and level up your skills through gamified challenges designed by industry experts. Your personalized grid adapts in real-time based on your progress.',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🧩',
  },
  {
    id: 'playcred',
    name: 'PlayCred™',
    href: '/playcred',
    description: 'Blockchain-verified achievement badges',
    details:
      'Showcase your achievements with tamper-proof, blockchain-verified credentials. Every badge, certificate, and milestone is permanently recorded and instantly verifiable by employers and peers. Build a credential portfolio that speaks for itself.',
    gradient: 'from-emerald-500 to-teal-500',
    icon: '🏅',
  },
  {
    id: 'mentor',
    name: 'MentorMatrix™',
    href: '/mentormatrix',
    description: 'AI-matched mentorship connections',
    details:
      'Get matched with the perfect mentor using our AI-powered compatibility algorithm. Whether you need guidance on career transitions, technical skills, or industry insights, MentorMatrix connects you with experienced professionals who align with your goals.',
    gradient: 'from-indigo-500 to-violet-500',
    icon: '🤝',
  },
  {
    id: 'impact',
    name: 'ImpactVault™',
    href: '/impactvault',
    description: 'Real-time analytics and skill gap insights',
    details:
      'Track your growth with real-time analytics and comprehensive skill gap insights. Visualize your learning progress, benchmark against industry standards, and get actionable recommendations to accelerate your career development.',
    gradient: 'from-amber-500 to-orange-500',
    icon: '📊',
  },
  {
    id: 'profile',
    name: 'Profile & Username',
    href: '/profile',
    description: 'Public profiles with usernames, privacy controls & sharing',
    details:
      'Create your professional identity with customizable public profiles. Set your unique username, control your privacy settings, and share your achievements across platforms. Your matriXO profile becomes your digital career card.',
    gradient: 'from-pink-500 to-rose-500',
    icon: '👤',
  },
] as const

type BetaFeature = (typeof betaFeatures)[number]
type FeatureId = BetaFeature['id']

type FeatureNavButtonProps = {
  feature: BetaFeature
  isActive: boolean
  onSelect: (featureId: FeatureId) => void
}

const FeatureNavButton = memo(function FeatureNavButton({ feature, isActive, onSelect }: FeatureNavButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(feature.id)}
      aria-pressed={isActive}
      className={`w-full text-left px-4 py-3 rounded-2xl border-l-4 transition-all duration-300 ${
        isActive
          ? 'bg-white/70 dark:bg-white/[0.08] border-blue-500'
          : 'bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-white/[0.04]'
      }`}
    >
      <div className={`font-bold ${isActive ? 'gradient-text' : 'text-gray-500 dark:text-gray-400'}`}>
        {feature.name}
      </div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="mt-2 block text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            Currently viewing
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
})

type FeaturePillButtonProps = FeatureNavButtonProps

const FeaturePillButton = memo(function FeaturePillButton({
  feature,
  isActive,
  onSelect,
}: FeaturePillButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(feature.id)}
      aria-pressed={isActive}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        isActive
          ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600'
          : 'text-gray-700 dark:text-gray-300 bg-gray-200/70 dark:bg-white/[0.08]'
      }`}
    >
      {feature.name}
    </button>
  )
})

export default function BetaFeaturesShowcase() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('skilldna')
  const [isBeta, setIsBeta] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const desktopScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)

    const hostname = window.location.hostname
    setIsBeta(hostname === 'beta.matrixo.in' || hostname === 'localhost')

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const updateViewport = () => setIsDesktop(desktopQuery.matches)

    updateViewport()
    desktopQuery.addEventListener('change', updateViewport)

    return () => {
      desktopQuery.removeEventListener('change', updateViewport)
    }
  }, [])

  useEffect(() => {
    if (!mounted || !isBeta || !isDesktop) return

    const section = desktopScrollRef.current
    if (!section) return

    let rafId: number | null = null

    const updateFeatureFromScroll = () => {
      rafId = null

      const totalScrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 1)
      const sectionTopFromViewport = section.getBoundingClientRect().top
      const sectionScrolledDistance = Math.min(Math.max(-sectionTopFromViewport, 0), totalScrollableDistance)
      const progress = sectionScrolledDistance / totalScrollableDistance
      const nextIndex = Math.min(betaFeatures.length - 1, Math.floor(progress * betaFeatures.length))
      const nextFeatureId = betaFeatures[nextIndex]?.id ?? betaFeatures[0].id

      setActiveFeature((prev) => (prev === nextFeatureId ? prev : nextFeatureId))
    }

    const handleScroll = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(updateFeatureFromScroll)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }

      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isBeta, isDesktop, mounted])

  if (!mounted || !isBeta) return null

  const feature = betaFeatures.find((item) => item.id === activeFeature) ?? betaFeatures[0]

  const handleFeatureSelect = (featureId: FeatureId) => {
    setActiveFeature(featureId)

    if (!isDesktop) return

    const section = desktopScrollRef.current
    if (!section) return

    const featureIndex = betaFeatures.findIndex((item) => item.id === featureId)
    if (featureIndex < 0) return

    const sectionStartY = window.scrollY + section.getBoundingClientRect().top
    const totalScrollableDistance = Math.max(section.offsetHeight - window.innerHeight, 0)
    const segmentDistance = totalScrollableDistance / betaFeatures.length
    const targetY = sectionStartY + featureIndex * segmentDistance

    window.scrollTo({ top: targetY, behavior: 'smooth' })
  }

  return (
    <section id="explore-features" className="section-padding bg-transparent">
      <div className="container-custom">
        <motion.div
          id="feature-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Explore <span className="gradient-text">New Features</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore our latest features and discover powerful tools designed to enhance your experience.
          </p>
        </motion.div>

        <div
          ref={desktopScrollRef}
          className="relative hidden lg:block"
          style={{ height: `${betaFeatures.length * 100}vh` }}
        >
          <div className="sticky top-0 h-screen">
            <div className="flex h-full items-center">
              <div className="grid h-[600px] w-full grid-cols-12 gap-6">
                <aside className="col-span-4 h-full">
                  <div className="space-y-2">
                    {betaFeatures.map((item) => (
                      <FeatureNavButton
                        key={item.id}
                        feature={item}
                        isActive={activeFeature === item.id}
                        onSelect={handleFeatureSelect}
                      />
                    ))}
                  </div>
                </aside>

                <div className="col-span-8 h-full w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="glass-card h-full w-full overflow-hidden flex"
                    >
                      <div className="h-full w-full">
                        <div className="min-h-full flex flex-col justify-start p-8 md:p-10">
                          <div className="mb-6 text-4xl">{feature.icon}</div>
                          <h3 className="mb-4 text-3xl font-display font-bold lg:text-4xl">
                            <span className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                              {feature.name}
                            </span>
                          </h3>
                          <p className="mb-4 text-xl font-medium text-gray-700 dark:text-gray-300">
                            {feature.description}
                          </p>
                          <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                            {feature.details}
                          </p>
                          <div>
                            <Link href={feature.href} className="btn-primary inline-flex items-center">
                              Try it now →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="sticky top-20 z-20 -mx-4 mb-6 border-y border-gray-200/70 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-white/[0.08] dark:bg-gray-950/80">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {betaFeatures.map((item) => (
                <FeaturePillButton
                  key={item.id}
                  feature={item}
                  isActive={activeFeature === item.id}
                  onSelect={handleFeatureSelect}
                />
              ))}
            </div>
          </div>

          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="glass-card w-full overflow-hidden"
              >
                <div className="p-8 md:p-10">
                  <div className="mb-6 text-4xl">{feature.icon}</div>
                  <h3 className="mb-4 text-3xl font-display font-bold lg:text-4xl">
                    <span className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                      {feature.name}
                    </span>
                  </h3>
                  <p className="mb-4 text-xl font-medium text-gray-700 dark:text-gray-300">
                    {feature.description}
                  </p>
                  <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                    {feature.details}
                  </p>
                  <div>
                    <Link href={feature.href} className="btn-primary inline-flex items-center">
                      Try it now →
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
