'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaCode, FaTrophy, FaLaptopCode, FaBriefcase, FaRocket, FaUsers } from 'react-icons/fa'

const features = [
  {
    icon: FaCode,
    title: 'Technical Workshops',
    description: 'Hands-on coding workshops on cutting-edge technologies taught by industry experts. Web development, AI/ML, cloud, and more.',
    href: '/services',
    gradient: 'from-purple-500 to-fuchsia-500',
    hasContactButton: true,
  },
  {
    icon: FaTrophy,
    title: 'Hackathons',
    description: 'Competitive coding events where students build real projects and solve industry challenges with prizes and recognition.',
    href: '/events',
    gradient: 'from-blue-500 to-cyan-500',
    hasContactButton: true,
  },
  {
    icon: FaLaptopCode,
    title: 'Bootcamps',
    description: 'Intensive multi-week training programs covering full-stack development, data science, cybersecurity, and more.',
    href: '/services',
    gradient: 'from-amber-500 to-orange-500',
    hasContactButton: true,
  },
  {
    icon: FaBriefcase,
    title: 'Career Programs',
    description: 'Placement preparation, resume building, mock interviews, and DSA training to help you land your dream job.',
    href: '/services',
    gradient: 'from-green-500 to-emerald-500',
    hasContactButton: false,
  },
  {
    icon: FaRocket,
    title: 'Campus Events',
    description: 'Large-scale technical events, seminars, and conferences hosted at educational institutions across India.',
    href: '/events',
    gradient: 'from-red-500 to-rose-500',
    hasContactButton: false,
  },
  {
    icon: FaUsers,
    title: 'Corporate Collaboration',
    description: 'Partner with us to train students, host events, run internship drives, and build a talent pipeline for your organization.',
    href: '/contact',
    gradient: 'from-indigo-500 to-violet-500',
    hasContactButton: false,
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
            What We <span className="gradient-text">Offer</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Comprehensive technical training programs designed to build
            industry-ready skills and launch successful tech careers.
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
              className="glass-card p-8 hover-lift hover-glow h-full flex flex-col"
            >
              <Link href={feature.href} className="flex-1">
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
              </Link>
              {feature.hasContactButton && (
                <Link 
                  href={`/contact?subject=${encodeURIComponent(feature.title)}`}
                  className="mt-6 btn-primary text-center"
                >
                  Contact Us
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
