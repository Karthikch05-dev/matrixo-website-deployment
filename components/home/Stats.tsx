'use client'

import { motion } from 'framer-motion'
import { FaUsers, FaGraduationCap, FaCalendarCheck, FaChartLine } from 'react-icons/fa'

const stats = [
  { icon: FaUsers, value: 'Growing', label: 'Community of Learners' },
  { icon: FaCalendarCheck, value: 'Regular', label: 'Events & Workshops' },
  { icon: FaGraduationCap, value: 'Quality', label: 'Technical Training' },
  { icon: FaChartLine, value: 'Expanding', label: 'Partner Network' },
]

export default function Stats() {
  return (
    <section className="section-padding bg-white dark:bg-gray-950">
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
                className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gray-900 dark:bg-white rounded-2xl text-white dark:text-gray-900"
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
