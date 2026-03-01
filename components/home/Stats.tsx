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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br ${stat.gradient} rounded-[var(--glass-radius-sm)] text-white shadow-lg`}
              >
                <stat.icon size={28} />
              </motion.div>
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
