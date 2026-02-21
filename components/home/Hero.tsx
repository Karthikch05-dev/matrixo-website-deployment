'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaCalendarCheck, FaRocket, FaUsers } from 'react-icons/fa'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Very subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gray-200 dark:bg-gray-800" />

      {/* Content */}
      <div className="relative z-10 container-custom px-4 sm:px-6 py-20 sm:py-24 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-6 px-6 py-2 bg-gray-100/80 dark:bg-white/[0.05] backdrop-blur-sm border border-gray-200 dark:border-white/[0.08] rounded-full"
          >
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm md:text-base">
              An Ed-Tech Startup 🚀
            </span>
          </motion.div>
        <br/>
          {/* Dynamic Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative inline-block mb-6"
          >
            {/* Light Mode Logo (Black) */}
            <img 
              src="/logos/logo-light.png" 
              alt="matriXO" 
              className="h-14 md:h-32 lg:h-20 w-auto mx-auto block dark:hidden"
            />
            {/* Dark Mode Logo (White) */}
            <img 
              src="/logos/logo-dark.png" 
              alt="matriXO" 
              className="h-14 md:h-32 lg:h-20 w-auto mx-auto transform hidden dark:block"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-3xl lg:text-4xl font-light text-gray-700 dark:text-gray-300 mb-4 max-w-4xl mx-auto"
          >
            Where Technical Excellence Meets Career Growth
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white mb-12"
          >
            Workshops. Hackathons. Bootcamps. Real Skills.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            Empowering students through hands-on technical training, competitive events, 
            and industry-relevant bootcamps. Build skills that matter.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="/events">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center space-x-2"
              >
                <FaCalendarCheck />
                <span>Explore Programs</span>
              </motion.button>
            </Link>

            <Link href="/services">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center space-x-2"
              >
                <FaRocket />
                <span>Our Programs</span>
              </motion.button>
            </Link>

            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center space-x-2"
              >
                <FaUsers />
                <span>Collaborate with Us</span>
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-300 dark:border-gray-600 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
