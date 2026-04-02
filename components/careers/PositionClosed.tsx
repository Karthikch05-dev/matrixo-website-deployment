'use client'

import { motion } from 'framer-motion'
import { FaBan, FaArrowLeft, FaClock, FaArchive, FaFileAlt } from 'react-icons/fa'
import Link from 'next/link'

type ClosedReason = 'closed' | 'expired' | 'draft' | 'archived' | 'not-found'

interface PositionClosedProps {
  reason: ClosedReason
  roleTitle?: string
}

const REASON_CONFIG: Record<ClosedReason, { icon: React.ReactNode; heading: string; description: string }> = {
  closed: {
    icon: <FaBan className="text-5xl text-red-400 mx-auto mb-4" />,
    heading: 'Position Closed',
    description: 'This position is no longer accepting applications. It may have been filled or closed by the hiring team.',
  },
  expired: {
    icon: <FaClock className="text-5xl text-amber-400 mx-auto mb-4" />,
    heading: 'Application Period Ended',
    description: 'The application window for this position has expired. The role is no longer accepting new submissions.',
  },
  draft: {
    icon: <FaFileAlt className="text-5xl text-yellow-400 mx-auto mb-4" />,
    heading: 'Position Not Available',
    description: 'This position has not been published yet. Please check back later or browse our other open positions.',
  },
  archived: {
    icon: <FaArchive className="text-5xl text-gray-400 mx-auto mb-4" />,
    heading: 'Position Archived',
    description: 'This position has been archived and is no longer available for applications.',
  },
  'not-found': {
    icon: <FaBan className="text-5xl text-gray-400 mx-auto mb-4" />,
    heading: 'Position Not Found',
    description: 'The position you are looking for does not exist or has been removed.',
  },
}

export default function PositionClosed({ reason, roleTitle }: PositionClosedProps) {
  const config = REASON_CONFIG[reason] || REASON_CONFIG['not-found']

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card p-10 sm:p-14 text-center max-w-lg mx-4"
      >
        {config.icon}

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {config.heading}
        </h1>

        {roleTitle && (
          <p className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-4">
            {roleTitle}
          </p>
        )}

        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          {config.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/careers">
            <motion.button
              whileHover={{ x: -3 }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              <FaArrowLeft className="text-sm" />
              Browse Open Positions
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
