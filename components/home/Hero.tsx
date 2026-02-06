'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaCalendarCheck, FaRocket, FaUsers } from 'react-icons/fa'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 dark:bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300 dark:bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

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
            className="inline-block mb-6 px-6 py-2 bg-blue-50 dark:bg-white/5 backdrop-blur-sm border border-blue-200 dark:border-blue-500/30 rounded-full"
          >
            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm md:text-base">
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
            className="text-2xl md:text-3xl font-display font-bold gradient-text mb-12"
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
            className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-neon-blue rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
