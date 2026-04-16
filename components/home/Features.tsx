'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineCodeBracketSquare,
  HiOutlineRocketLaunch,
  HiOutlineTrophy,
  HiOutlineUserGroup,
} from 'react-icons/hi2'

const features = [
  {
    icon: HiOutlineCodeBracketSquare,
    title: 'Technical Workshops',
    description: 'Hands-on coding workshops on cutting-edge technologies taught by industry experts. Web development, AI/ML, cloud, and more.',
    href: '/services',
  },
  {
    icon: HiOutlineTrophy,
    title: 'Hackathons',
    description: 'Competitive coding events where students build real projects and solve industry challenges with prizes and recognition.',
    href: '/events',
  },
  {
    icon: HiOutlineAcademicCap,
    title: 'Bootcamps',
    description: 'Intensive multi-week training programs covering full-stack development, data science, cybersecurity, and more.',
    href: '/services',
  },
  {
    icon: HiOutlineBriefcase,
    title: 'Career Programs',
    description: 'Placement preparation, resume building, mock interviews, and DSA training to help you land your dream job.',
    href: '/services',
  },
  {
    icon: HiOutlineRocketLaunch,
    title: 'Campus Events',
    description: 'Large-scale technical events, seminars, and conferences hosted at educational institutions across India.',
    href: '/events',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'Corporate Collaboration',
    description: 'Partner with us to train students, host events, run internship drives, and build a talent pipeline for your organization.',
    href: '/contact',
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
            <Link key={feature.title} href={feature.href} className="block h-full">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ y: -4, scale: 1.05 }}
                className="group h-full cursor-pointer transition-all duration-300 ease-in-out"
              >
                <div
                  className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-8 shadow-[0_18px_40px_rgba(2,6,23,0.32)] transition-all duration-300 ease-in-out group-hover:shadow-[0_24px_52px_rgba(2,6,23,0.4)]"
                >
                  <div className="relative flex h-full flex-col">
                    <div
                      className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    >
                      <feature.icon
                        className="h-8 w-8 text-gray-100"
                      />
                    </div>

                    <h3 className="relative mb-3 text-xl font-bold text-white">
                      {feature.title}
                    </h3>
                    <p className="relative text-[15px] leading-7 text-gray-400">
                      {feature.description}
                    </p>

                    <div className="relative mt-6 flex items-center text-sm font-semibold text-gray-300">
                      <span>Learn more</span>
                      <span className="ml-2 transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
