'use client'

import { motion } from 'framer-motion'
import { FaDna, FaGraduationCap, FaRocket } from 'react-icons/fa'

export default function About() {
  return (
    <section className="section-padding bg-white/30 dark:bg-white/[0.01] backdrop-blur-sm">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Who We <span className="gradient-text">Are</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            matriXO is an MSME-registered ed-tech startup building the future of skill
            development. We combine AI, blockchain, and adaptive learning to bridge the gap
            between academic knowledge and industry demands.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: FaDna,
              title: 'AI Skill Mapping',
              description: 'Our SkillDNA™ engine analyzes your technical abilities, behavioral traits, and learning patterns to create a unique skill genome — giving you clarity on exactly where you stand.',
              gradient: 'from-purple-500 to-fuchsia-500',
            },
            {
              icon: FaGraduationCap,
              title: 'Adaptive Growth',
              description: 'No generic courses. GrowGrid™ builds personalized learning paths that adapt to your pace, goals, and skill gaps — so every hour you invest moves the needle.',
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              icon: FaRocket,
              title: 'Verified Credentials',
              description: 'Prove your worth with blockchain-backed PlayCred™ badges that recruiters can trust. Your achievements, permanently verifiable and shareable.',
              gradient: 'from-green-500 to-emerald-500',
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="glass-card p-8 hover-lift hover-glow"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-[var(--glass-radius-sm)] flex items-center justify-center mb-6 text-white shadow-lg`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
