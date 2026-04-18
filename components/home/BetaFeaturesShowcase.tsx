'use client'

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent,
} from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

const features = [
  {
    id: 'skilldna',
    title: 'SkillDNA™',
    description: 'AI-powered skill assessment and genome visualization',
    content: {
      details:
        'Discover your unique skill genome through AI-powered assessment. Our advanced algorithms analyze your technical abilities, learning patterns, and growth trajectory to create a visual DNA map of your capabilities. Understand your strengths, identify gaps, and get personalized recommendations.',
      href: '/skilldna',
      gradient: 'from-purple-500 to-fuchsia-500',
      icon: '🧬',
    },
  },
  {
    id: 'growgrid',
    title: 'GrowGrid™',
    description: 'Adaptive learning paths with gamification',
    content: {
      details:
        'Navigate your learning journey with adaptive pathways that evolve with you. Earn XP, unlock achievements, and level up your skills through gamified challenges designed by industry experts. Your personalized grid adapts in real-time based on your progress.',
      href: '/growgrid',
      gradient: 'from-blue-500 to-cyan-500',
      icon: '🧩',
    },
  },
  {
    id: 'playcred',
    title: 'PlayCred™',
    description: 'Blockchain-verified achievement badges',
    content: {
      details:
        'Showcase your achievements with tamper-proof, blockchain-verified credentials. Every badge, certificate, and milestone is permanently recorded and instantly verifiable by employers and peers. Build a credential portfolio that speaks for itself.',
      href: '/playcred',
      gradient: 'from-emerald-500 to-teal-500',
      icon: '🏅',
    },
  },
  {
    id: 'mentormatrix',
    title: 'MentorMatrix™',
    description: 'AI-matched mentorship connections',
    content: {
      details:
        'Get matched with the perfect mentor using our AI-powered compatibility algorithm. Whether you need guidance on career transitions, technical skills, or industry insights, MentorMatrix connects you with experienced professionals who align with your goals.',
      href: '/mentormatrix',
      gradient: 'from-indigo-500 to-violet-500',
      icon: '🤝',
    },
  },
  {
    id: 'impactvault',
    title: 'ImpactVault™',
    description: 'Real-time analytics and skill gap insights',
    content: {
      details:
        'Track your growth with real-time analytics and comprehensive skill gap insights. Visualize your learning progress, benchmark against industry standards, and get actionable recommendations to accelerate your career development.',
      href: '/impactvault',
      gradient: 'from-amber-500 to-orange-500',
      icon: '📊',
    },
  },
  {
    id: 'profile',
    title: 'Profile & Username',
    description: 'Public profiles with usernames, privacy controls & sharing',
    content: {
      details:
        'Create your professional identity with customizable public profiles. Set your unique username, control your privacy settings, and share your achievements across platforms. Your matriXO profile becomes your digital career card.',
      href: '/profile',
      gradient: 'from-pink-500 to-rose-500',
      icon: '👤',
    },
  },
] as const

type Feature = (typeof features)[number]

type FeatureNavButtonProps = {
  feature: Feature
  index: number
  isActive: boolean
  onSelect: (index: number) => void
}

const FeatureNavButton = memo(function FeatureNavButton({
  feature,
  index,
  isActive,
  onSelect,
}: FeatureNavButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-pressed={isActive}
      className={`w-full text-left px-4 py-3 rounded-xl border-l-4 transition-all duration-300 ${
        isActive
          ? 'bg-white/70 dark:bg-white/[0.08] border-blue-500 opacity-100'
          : 'border-transparent opacity-60 hover:opacity-100 hover:bg-white/40 dark:hover:bg-white/[0.04]'
      }`}
    >
      <div className={`font-bold ${isActive ? 'gradient-text' : 'text-gray-500 dark:text-gray-400'}`}>
        {feature.title}
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
  index,
  isActive,
  onSelect,
}: FeaturePillButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      aria-pressed={isActive}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        isActive
          ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600'
          : 'text-gray-700 dark:text-gray-300 bg-gray-200/70 dark:bg-white/[0.08]'
      }`}
    >
      {feature.title}
    </button>
  )
})

export default function BetaFeaturesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isBeta, setIsBeta] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const animationTimeoutRef = useRef<number | null>(null)
  const lastIndex = features.length - 1
  const desktopScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current !== null) {
        window.clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  const startCooldown = useCallback(() => {
    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current)
    }

    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }, [])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (isAnimating) return

      if (event.deltaY > 0 && activeIndex < lastIndex) {
        setIsAnimating(true)
        setActiveIndex((prevIndex) => Math.min(prevIndex + 1, lastIndex))
        startCooldown()
      } else if (event.deltaY < 0 && activeIndex > 0) {
        setIsAnimating(true)
        setActiveIndex((prevIndex) => Math.max(prevIndex - 1, 0))
        startCooldown()
      }
    },
    [activeIndex, isAnimating, lastIndex, startCooldown],
  )

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!isHovering || isAnimating) return

      const rect = event.currentTarget.getBoundingClientRect()
      const y = event.clientY - rect.top
      const height = rect.height
      const topZone = height * 0.25
      const bottomZone = height * 0.75

      if (y > bottomZone && activeIndex < lastIndex) {
        setIsAnimating(true)
        setActiveIndex((prevIndex) => Math.min(prevIndex + 1, lastIndex))
        startCooldown()
      } else if (y < topZone && activeIndex > 0) {
        setIsAnimating(true)
        setActiveIndex((prevIndex) => Math.max(prevIndex - 1, 0))
        startCooldown()
      }
    },
    [activeIndex, isAnimating, isHovering, lastIndex, startCooldown],
  )

  if (!mounted || !isBeta) return null

  const activeFeature = features[activeIndex]

  return (
    <section id="explore-features" className="section-padding bg-transparent carousel-section">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:h-[75vh]">
          <aside className="hidden lg:col-span-4 lg:block lg:h-full lg:sticky lg:top-24">
            <div className="space-y-2">
              {features.map((item, index) => (
                <FeatureNavButton
                  key={item.id}
                  feature={item}
                  index={index}
                  isActive={activeIndex === index}
                  onSelect={setActiveIndex}
                />
              ))}
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
              {features.map((item, index) => (
                <FeaturePillButton
                  key={item.id}
                  feature={item}
                  index={index}
                  isActive={activeIndex === index}
                  onSelect={setActiveIndex}
                  isActive={activeFeature === item.id}
                  onSelect={handleFeatureSelect}
                />
              ))}
            </div>
          </div>

          <div className="w-full lg:col-span-8">
            <div
              className="right-panel h-[75vh] w-full"
              onWheel={handleWheel}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={handleMouseMove}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="glass-card min-h-[75vh] p-8 md:p-10">
                    <div className="mb-6 text-4xl">{activeFeature.content.icon}</div>
                    <h3 className="mb-4 text-3xl font-display font-bold lg:text-4xl">
                      <span
                        className={`bg-gradient-to-r ${activeFeature.content.gradient} bg-clip-text text-transparent`}
                      >
                        {activeFeature.title}
                      </span>
                    </h3>
                    <p className="mb-4 text-xl font-medium text-gray-700 dark:text-gray-300">
                      {activeFeature.description}
                    </p>
                    <p className="mb-8 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                      {activeFeature.content.details}
                    </p>
                    <div>
                      <Link href={activeFeature.content.href} className="btn-primary inline-flex items-center">
                        Try it now →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
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
