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
}

const stats: FeatureStat[] = [
  { icon: HiOutlineCpuChip, title: 'AI-Powered', subtitle: 'Skill Analysis' },
  { icon: HiOutlineSquares2X2, title: '5 Products', subtitle: 'One Platform' },
  { icon: HiOutlineAdjustmentsHorizontal, title: 'Personalized', subtitle: 'Learning Paths' },
  { icon: HiOutlineShieldCheck, title: 'Verifiable', subtitle: 'Credentials' },
]

function FeatureCard({
  icon: Icon,
  title,
  subtitle,
  index,
}: FeatureStat & { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="group relative flex h-full flex-col items-center rounded-[28px] border border-white/[0.07] bg-[#111318]/80 px-6 py-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.14] sm:px-8 sm:py-10"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-slate-100 transition-colors duration-300 group-hover:border-slate-200/[0.16] group-hover:bg-white/[0.05]">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h3>
      <p className="mt-2 text-sm font-medium text-gray-400 sm:text-base">
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
