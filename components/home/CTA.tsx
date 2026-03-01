'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaArrowRight, FaDna } from 'react-icons/fa'

export default function CTA() {
  return (
    <section className="section-padding bg-white/30 dark:bg-white/[0.01] backdrop-blur-sm relative overflow-hidden">
      {/* Subtle glass panel background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/50 dark:bg-purple-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900 dark:text-white">
            Ready to Discover
            <span className="gradient-text block mt-2">Your Skill Genome?</span>
          </h2>

          <p className="text-xl text-gray-700 dark:text-gray-300 mb-12">
            Join matriXO&apos;s AI-powered platform and get a personalized roadmap
            from where you are to where you want to be.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/skilldna">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center justify-center space-x-2 text-lg"
              >
                <FaDna />
                <span>Start Your SkillDNA</span>
                <FaArrowRight />
              </motion.button>
            </Link>

            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center justify-center text-lg"
              >
                Partner with Us
              </motion.button>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-wrap justify-center gap-8 text-gray-400"
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 dark:text-white text-2xl">✓</span>
              <span>AI Skill Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 dark:text-white text-2xl">✓</span>
              <span>Personalized Paths</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-900 dark:text-white text-2xl">✓</span>
              <span>Verified Credentials</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
