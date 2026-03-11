'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isBeta, setIsBeta] = useState(false)

  useEffect(() => {
    // Check if we're on beta site
    const checkBeta = window.location.hostname === 'beta.matrixo.in'
    setIsBeta(checkBeta)
  }, [])

  if (!isBeta || !isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        data-beta-banner="true"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white shadow-lg"
      >
        <div className="container-custom px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-white text-purple-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              BETA
            </span>
            <p className="text-sm md:text-base font-medium">
              🚀 You're testing the next generation of matriXO! New features, early access, your feedback shapes the future.
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200 transition-colors ml-4"
            aria-label="Close banner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
