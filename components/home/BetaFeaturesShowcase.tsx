'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
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
  const [mounted, setMounted] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const featureSectionRefs = useRef<Partial<Record<FeatureId, HTMLDivElement | null>>>({})

  useEffect(() => {
    setMounted(true)
    setIsBeta(window.location.hostname === 'beta.matrixo.in' || window.location.hostname === 'localhost')
  }, [])

  const scrollToFeature = useCallback((featureId: FeatureId) => {
    setActiveFeature(featureId)
    const scrollContainer = scrollContainerRef.current
    const targetSection = featureSectionRefs.current[featureId]

    if (!scrollContainer || !targetSection) return

    scrollContainer.scrollTo({
      top: Math.max(0, targetSection.offsetTop - 20),
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    if (!mounted || !isBeta) return

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const sections = Object.values(featureSectionRefs.current).filter(
      (section): section is HTMLDivElement => Boolean(section),
    )

    if (!sections.length) return

    const intersectionRatios = new Map<FeatureId, number>()

    sections.forEach((section) => {
      const featureId = section.dataset.featureId as FeatureId | undefined

      if (featureId) {
        intersectionRatios.set(featureId, 0)
      }
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!(entry.target instanceof HTMLElement)) return

          const featureId = entry.target.dataset.featureId as FeatureId | undefined
          if (!featureId) return

          intersectionRatios.set(
            featureId,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          )
        })

        let nextActiveFeature: FeatureId | undefined
        let maxIntersectionRatio = 0

        intersectionRatios.forEach((ratio, featureId) => {
          if (ratio > maxIntersectionRatio) {
            maxIntersectionRatio = ratio
            nextActiveFeature = featureId
          }
        })

        if (nextActiveFeature && maxIntersectionRatio > 0) {
          setActiveFeature(nextActiveFeature)
        }
      },
      {
        root: scrollContainer,
        threshold: 0.6,
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [isBeta, mounted])

  if (!mounted || !isBeta) return null

  return (
    <section className="section-padding bg-transparent">
      <div className="container-custom">
        <motion.div
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:h-[75vh]">
          <aside className="hidden lg:col-span-4 lg:block lg:h-full lg:sticky lg:top-24">
            <div className="space-y-2">
              {betaFeatures.map((item) => (
                <FeatureNavButton
                  key={item.id}
                  feature={item}
                  isActive={activeFeature === item.id}
                  onSelect={scrollToFeature}
                />
              ))}
            </div>
          </aside>

          <div className="sticky top-20 z-20 -mx-4 mb-6 border-y border-gray-200/70 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-white/[0.08] dark:bg-gray-950/80 lg:hidden">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {betaFeatures.map((item) => (
                <FeaturePillButton
                  key={item.id}
                  feature={item}
                  isActive={activeFeature === item.id}
                  onSelect={scrollToFeature}
                />
              ))}
            </div>
          </div>

          <div className="w-full lg:col-span-8">
            <div
              ref={scrollContainerRef}
              className="h-[75vh] w-full overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory overscroll-contain pr-2 custom-scrollbar"
            >
              <div className="space-y-6">
                {betaFeatures.map((item) => (
                  <div
                    key={item.id}
                    id={`feature-${item.id}`}
                    data-feature-id={item.id}
                    ref={(element) => {
                      featureSectionRefs.current[item.id] = element
                    }}
                    className="glass-card min-h-[75vh] snap-start snap-always p-8 md:p-10"
                  >
                    <div className="mb-6 text-4xl">{item.icon}</div>
                    <h3 className="mb-4 text-3xl font-display font-bold lg:text-4xl">
                      <span className={`bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                        {item.name}
                      </span>
                    </h3>
                    <p className="mb-4 text-xl font-medium text-gray-700 dark:text-gray-300">
                      {item.description}
                    </p>
                    <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                      {item.details}
                    </p>
                    <div>
                      <Link href={item.href} className="btn-primary inline-flex items-center">
                        Try it now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
