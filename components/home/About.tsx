'use client'

import { motion } from 'framer-motion'
import { FaCode, FaGraduationCap, FaRocket } from 'react-icons/fa'
import Features from '@/components/home/Features'
import Partners from '@/components/home/Partners'

export default function About() {
  return (
    <>
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
              icon: FaCode,
              title: 'Hands-on Training',
              description: 'Industry-relevant workshops and bootcamps with real coding projects. Learn web development, AI/ML, cloud computing, and more from expert instructors.',
              gradient: 'from-purple-500 to-fuchsia-500',
            },
            {
              icon: FaGraduationCap,
              title: 'Career Growth',
              description: 'Placement preparation, resume building, mock interviews, and mentorship programs designed to help you land your dream tech job.',
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              icon: FaRocket,
              title: 'Industry Partnerships',
              description: 'We partner with leading institutions and companies to deliver cutting-edge technical training and create career opportunities for students.',
              gradient: 'from-green-500 to-emerald-500',
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="glass-card p-8 hover-lift hover-glow transition-shadow duration-300"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-6 text-white shadow-md`}>
                <item.icon size={22} />
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

    <Features />
    <Partners />
    </>
  )
}
