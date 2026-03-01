'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaDna, FaChartLine, FaMedal, FaUserFriends, FaChartBar, FaUserCircle } from 'react-icons/fa'

const features = [
  {
    icon: FaDna,
    title: 'SkillDNA™',
    description: 'AI maps your unique skill genome — technical abilities, behavioral traits, and learning patterns analyzed in real time.',
    href: '/skilldna',
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  {
    icon: FaChartLine,
    title: 'GrowGrid™',
    description: 'Adaptive learning paths that evolve with you. AI-recommended courses, projects, and milestones personalized to your goals.',
    href: '/growgrid',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FaMedal,
    title: 'PlayCred™',
    description: 'Earn blockchain-verified achievement badges. Prove your skills with tamper-proof credentials that recruiters trust.',
    href: '/playcred',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: FaUserFriends,
    title: 'MentorMatrix™',
    description: 'AI-matched mentorship connections. Get paired with industry professionals who align with your career trajectory.',
    href: '/mentormatrix',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: FaChartBar,
    title: 'ImpactVault™',
    description: 'Real-time analytics dashboard showing your growth, skill gaps, and career alignment scores — powered by AI insights.',
    href: '/impactvault',
    gradient: 'from-red-500 to-rose-500',
  },
  {
    icon: FaUserCircle,
    title: 'Public Profiles',
    description: 'Your professional identity — LinkedIn-style profiles with SkillDNA integration, shareable and downloadable as PDF or JPG.',
    href: '/profile',
    gradient: 'from-indigo-500 to-violet-500',
  },
]

export default function Features() {
  return (
    <section className="section-padding bg-transparent">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            The <span className="gradient-text">matriXO</span> Platform
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Six AI-powered products working together to map, grow, verify,
            and showcase your skills — from first code to first job.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link key={feature.title} href={feature.href}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10 }}
                className="glass-card p-8 hover-lift hover-glow cursor-pointer h-full"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 text-white shadow-lg`}
                >
                  <feature.icon size={24} />
                </motion.div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
