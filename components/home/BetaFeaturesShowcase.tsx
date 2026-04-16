'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const betaFeatures = [
  {
    name: 'SkillDNA™',
    href: '/skilldna',
    description: 'AI-powered skill assessment and genome visualization',
    details:
      'Discover your unique skill genome through AI-powered assessment. Our advanced algorithms analyze your technical abilities, learning patterns, and growth trajectory to create a visual DNA map of your capabilities. Understand your strengths, identify gaps, and get personalized recommendations.',
    gradient: 'from-purple-500 to-fuchsia-500',
    icon: '🧬',
  },
  {
    name: 'GrowGrid™',
    href: '/growgrid',
    description: 'Adaptive learning paths with gamification',
    details:
      'Navigate your learning journey with adaptive pathways that evolve with you. Earn XP, unlock achievements, and level up your skills through gamified challenges designed by industry experts. Your personalized grid adapts in real-time based on your progress.',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🧩',
  },
  {
    name: 'PlayCred™',
    href: '/playcred',
    description: 'Blockchain-verified achievement badges',
    details:
      'Showcase your achievements with tamper-proof, blockchain-verified credentials. Every badge, certificate, and milestone is permanently recorded and instantly verifiable by employers and peers. Build a credential portfolio that speaks for itself.',
    gradient: 'from-emerald-500 to-teal-500',
    icon: '🏅',
  },
  {
    name: 'MentorMatrix™',
    href: '/mentormatrix',
    description: 'AI-matched mentorship connections',
    details:
      'Get matched with the perfect mentor using our AI-powered compatibility algorithm. Whether you need guidance on career transitions, technical skills, or industry insights, MentorMatrix connects you with experienced professionals who align with your goals.',
    gradient: 'from-indigo-500 to-violet-500',
    icon: '🤝',
  },
  {
    name: 'ImpactVault™',
    href: '/impactvault',
    description: 'Real-time analytics and skill gap insights',
    details:
      'Track your growth with real-time analytics and comprehensive skill gap insights. Visualize your learning progress, benchmark against industry standards, and get actionable recommendations to accelerate your career development.',
    gradient: 'from-amber-500 to-orange-500',
    icon: '📊',
  },
  {
    name: 'Profile & Username',
    href: '/profile',
    description: 'Public profiles with usernames, privacy controls & sharing',
    details:
      'Create your professional identity with customizable public profiles. Set your unique username, control your privacy settings, and share your achievements across platforms. Your matriXO profile becomes your digital career card.',
    gradient: 'from-pink-500 to-rose-500',
    icon: '👤',
  },
]

export default function BetaFeaturesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isBeta, setIsBeta] = useState(false)
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const featureRefs = useRef<Array<HTMLDivElement | null>>([])
  const mobilePillRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    setMounted(true)
    setIsBeta(window.location.hostname === 'beta.matrixo.in' || window.location.hostname === 'localhost')
  }, [])

  useEffect(() => {
    if (!isBeta) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleEntry) return

        const index = Number((visibleEntry.target as HTMLElement).dataset.index)
        if (!Number.isNaN(index)) {
          setActiveIndex(index)
        }
      },
      {
        threshold: 0.5,
        rootMargin: '-20% 0px -20% 0px',
      }
    )

    featureRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [isBeta])

  useEffect(() => {
    mobilePillRefs.current[activeIndex]?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeIndex, prefersReducedMotion])

  const scrollToFeature = (index: number) => {
    const target = document.getElementById(`beta-feature-${index}`)
    target?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
  }

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

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-10 lg:items-start">
          <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-0 lg:h-screen">
            <div className="h-full pt-24 pb-6 space-y-2">
              {betaFeatures.map((feature, index) => {
                const isActive = activeIndex === index

                return (
                  <button
                    key={feature.name}
                    type="button"
                    onClick={() => scrollToFeature(index)}
                    className={`w-full text-left px-4 py-3 rounded-2xl border-l-4 transition-all duration-300 ${
                      isActive
                        ? 'bg-white/70 dark:bg-white/[0.08] border-blue-500'
                        : 'bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className={`font-bold ${isActive ? 'gradient-text' : 'text-gray-500 dark:text-gray-400'}`}>
                      {feature.name}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.description}</p>
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          className="block mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400"
                        >
                          Currently viewing
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="lg:hidden sticky top-20 z-20 -mx-4 px-4 py-3 mb-6 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-y border-gray-200/70 dark:border-white/[0.08]">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {betaFeatures.map((feature, index) => {
                const isActive = activeIndex === index

                return (
                  <button
                    key={feature.name}
                    ref={(el) => {
                      mobilePillRefs.current[index] = el
                    }}
                    type="button"
                    onClick={() => scrollToFeature(index)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600'
                        : 'text-gray-700 dark:text-gray-300 bg-gray-200/70 dark:bg-white/[0.08]'
                    }`}
                  >
                    {feature.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 lg:h-screen lg:overflow-y-auto lg:pr-2">
            {betaFeatures.map((feature, index) => (
              <motion.div
                key={feature.name}
                id={`beta-feature-${index}`}
                data-index={index}
                ref={(el) => {
                  featureRefs.current[index] = el
                }}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="glass-card p-8 md:p-10 min-h-[60vh] flex flex-col justify-center"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-3xl font-display font-bold mb-3">
                  <span className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    {feature.name}
                  </span>
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-4">{feature.description}</p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">{feature.details}</p>
                <div>
                  <Link href={feature.href} className="btn-primary inline-flex items-center">
                    Try it now →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
