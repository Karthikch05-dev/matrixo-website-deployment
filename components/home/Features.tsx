'use client'

import { motion } from 'framer-motion'
import { FaRocket, FaChartLine, FaGraduationCap, FaLightbulb, FaCalendarCheck, FaUsers } from 'react-icons/fa'

const features = [
  {
    icon: FaChartLine,
    title: 'Technical Workshops',
    description: 'Hands-on coding workshops covering latest technologies, frameworks, and industry best practices.',
  },
  {
    icon: FaRocket,
    title: 'Hackathons',
    description: 'Competitive coding events where students build real projects and solve industry challenges.',
  },
  {
    icon: FaGraduationCap,
    title: 'Bootcamps',
    description: 'Intensive training programs designed to make students industry-ready in weeks.',
  },
  {
    icon: FaLightbulb,
    title: 'Career Programs',
    description: 'Placement preparation, interview coaching, and career guidance for students.',
  },
  {
    icon: FaCalendarCheck,
    title: 'Campus Events',
    description: 'Technical events, seminars, and competitions hosted at educational institutions.',
  },
  {
    icon: FaUsers,
    title: 'Community Building',
    description: 'Building a strong network of tech enthusiasts, mentors, and industry professionals.',
  },
]

export default function Features() {
  return (
    <section className="section-padding bg-white dark:bg-gray-950">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Why Choose <span className="gradient-text">matriXO</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Empowering students with technical skills and real-world experience through 
            comprehensive training programs and industry-focused events.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-white/[0.03] p-8 rounded-2xl border border-gray-200/80 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-none"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-14 h-14 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center mb-6 text-white dark:text-gray-900"
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
          ))}
        </div>
      </div>
    </section>
  )
}
