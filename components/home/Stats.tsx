'use client'

import { motion } from 'framer-motion'
import { FaBrain, FaCubes, FaRoute, FaCertificate } from 'react-icons/fa'

const stats = [
  { icon: FaBrain, value: 'AI-Powered', label: 'Skill Analysis', gradient: 'from-purple-500 to-fuchsia-500' },
  { icon: FaCubes, value: '5 Products', label: 'One Platform', gradient: 'from-blue-500 to-cyan-500' },
  { icon: FaRoute, value: 'Personalized', label: 'Learning Paths', gradient: 'from-green-500 to-emerald-500' },
  { icon: FaCertificate, value: 'Verifiable', label: 'Credentials', gradient: 'from-amber-500 to-orange-500' },
]

export default function Stats() {
  return (
    <section className="section-padding bg-transparent">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center group"
            >
              <div
                className={`inline-flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br ${stat.gradient} rounded-xl text-white shadow-md`}
              >
                <stat.icon size={24} />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
