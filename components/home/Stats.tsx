'use client'

import { motion } from 'framer-motion'
import type { IconType } from 'react-icons'
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCpuChip,
  HiOutlineShieldCheck,
  HiOutlineSquares2X2,
} from 'react-icons/hi2'

type FeatureStat = {
  icon: IconType
  title: string
  subtitle: string
  iconClassName: string
  iconContainerClassName: string
}

const stats: FeatureStat[] = [
  {
    icon: HiOutlineCpuChip,
    title: 'AI-Powered',
    subtitle: 'Skill Analysis',
    iconClassName: 'text-indigo-600 dark:text-violet-400',
    iconContainerClassName: 'bg-indigo-500/10 text-indigo-600 dark:bg-violet-500/10 dark:text-violet-400',
  },
  {
    icon: HiOutlineSquares2X2,
    title: '5 Products',
    subtitle: 'One Platform',
    iconClassName: 'text-sky-600 dark:text-sky-400',
    iconContainerClassName: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  },
  {
    icon: HiOutlineAdjustmentsHorizontal,
    title: 'Personalized',
    subtitle: 'Learning Paths',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
    iconContainerClassName: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Verifiable',
    subtitle: 'Credentials',
    iconClassName: 'text-amber-600 dark:text-amber-400',
    iconContainerClassName: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
]

function FeatureCard({
  icon: Icon,
  title,
  subtitle,
  iconClassName,
  iconContainerClassName,
  index,
}: FeatureStat & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="group relative flex h-full flex-col items-center overflow-hidden rounded-[28px] border border-zinc-200 bg-white px-6 py-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-300 ease-in-out hover:border-zinc-300 hover:shadow-lg dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-[0_18px_40px_rgba(0,0,0,0.18)] dark:hover:border-white/20 sm:px-8 sm:py-10"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-16 bg-gradient-to-b from-white/5 to-transparent dark:block" />

      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl p-3 ring-1 ring-inset ring-black/5 dark:ring-white/10 ${iconContainerClassName}`}>
        <Icon className={`h-7 w-7 ${iconClassName}`} />
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
        {title}
      </h3>
      <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-base">
        {subtitle}
      </p>
    </motion.div>
  )
}

export default function Stats() {
  return (
    <section className="section-padding bg-transparent">
      <div className="container-custom">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat, index) => (
            <FeatureCard
              key={stat.title}
              index={index}
              {...stat}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
