'use client'

import { motion } from 'framer-motion'
import { FaGraduationCap, FaLightbulb, FaRocket } from 'react-icons/fa'

export default function About() {
  return (
    <section className="section-padding bg-gray-50/50 dark:bg-gray-900/50">
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
            matriXO is an MSME-registered organization dedicated to bridging the gap between 
            academic learning and industry requirements through technical workshops, hackathons, 
            bootcamps, and career-focused events.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: FaGraduationCap,
              title: 'Hands-On Learning',
              description: 'Practical workshops and bootcamps that teach real-world skills through project-based learning.',
            },
            {
              icon: FaLightbulb,
              title: 'Industry-Relevant',
              description: 'Programs designed with industry experts to ensure students learn what companies actually need.',
            },
            {
              icon: FaRocket,
              title: 'Career Growth',
              description: 'From technical hackathons to placement preparation, we focus on building career-ready students.',
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
              <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center mb-6 text-white dark:text-gray-900">
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
