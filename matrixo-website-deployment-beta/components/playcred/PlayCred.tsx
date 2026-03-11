'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTrophy, FaMedal, FaStar, FaAward, FaShieldAlt, FaDownload, FaShareAlt, FaLink, FaCheckCircle, FaCertificate } from 'react-icons/fa'

interface Badge {
  id: string
  name: string
  description: string
  icon: any
  color: string
  earnedDate: string
  verified: boolean
  blockchainHash: string
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const badges: Badge[] = [
  {
    id: 'badge1',
    name: 'JavaScript Master',
    description: 'Completed all JavaScript fundamentals modules',
    icon: FaTrophy,
    color: 'from-yellow-400 to-orange-500',
    earnedDate: '2025-01-15',
    verified: true,
    blockchainHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7a...',
    category: 'Programming',
    rarity: 'epic',
  },
  {
    id: 'badge2',
    name: 'React Ninja',
    description: 'Built 5 production-ready React applications',
    icon: FaAward,
    color: 'from-blue-400 to-cyan-500',
    earnedDate: '2025-01-10',
    verified: true,
    blockchainHash: '0x8a0fade2d1e68b8bg77bc5fbe8a0fade2d1e68b8...',
    category: 'Frontend',
    rarity: 'legendary',
  },
  {
    id: 'badge3',
    name: 'Problem Solver',
    description: 'Solved 100+ coding challenges',
    icon: FaStar,
    color: 'from-purple-400 to-pink-500',
    earnedDate: '2025-01-08',
    verified: true,
    blockchainHash: '0x9b1fade3e2f79c9ch88cd6gdb9b1fade3e2f79c9...',
    category: 'Skills',
    rarity: 'rare',
  },
  {
    id: 'badge4',
    name: 'Team Player',
    description: 'Collaborated on 10+ group projects',
    icon: FaMedal,
    color: 'from-green-400 to-emerald-500',
    earnedDate: '2025-01-05',
    verified: true,
    blockchainHash: '0xac2fade4f3g89d0di99de7hec2fade4f3g89d0d...',
    category: 'Collaboration',
    rarity: 'common',
  },
  {
    id: 'badge5',
    name: 'Design Wizard',
    description: 'Created stunning UI/UX designs',
    icon: FaCertificate,
    color: 'from-pink-400 to-rose-500',
    earnedDate: '2025-01-03',
    verified: true,
    blockchainHash: '0xbd3fade5g4h99e1ej00ef8ifd3fade5g4h99e1e...',
    category: 'Design',
    rarity: 'epic',
  },
  {
    id: 'badge6',
    name: 'Fast Learner',
    description: 'Completed 3 courses in one week',
    icon: FaShieldAlt,
    color: 'from-indigo-400 to-purple-500',
    earnedDate: '2025-01-01',
    verified: true,
    blockchainHash: '0xce4fade6h5i00f2fk11fg9jge4fade6h5i00f2f...',
    category: 'Achievement',
    rarity: 'rare',
  },
]

const rarityColors = {
  common: 'border-gray-400 bg-gray-100 dark:bg-gray-800',
  rare: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
  epic: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
  legendary: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
}

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

export default function PlayCred() {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const filteredBadges = filter === 'all' ? badges : badges.filter(b => b.category === filter)
  const categories = ['all', ...Array.from(new Set(badges.map(b => b.category)))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-gray-900 dark:via-yellow-900/10 dark:to-orange-900/10 py-20">
      <div className="container-custom px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-full mb-4">
            <FaTrophy className="animate-bounce" />
            <span className="font-bold">PlayCred™ Digital Credentials</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Your Verified Achievements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Blockchain-verified badges that showcase your skills to the world
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 text-center"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
              {badges.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Badges</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 text-center"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
              {badges.filter(b => b.rarity === 'legendary').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Legendary</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 text-center"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
              {badges.filter(b => b.verified).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 text-center"
          >
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
              {categories.length - 1}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                filter === category
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                  : 'bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredBadges.map((badge, index) => {
            const Icon = badge.icon
            
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedBadge(badge)}
                className={`group cursor-pointer p-6 rounded-2xl border-2 ${rarityColors[badge.rarity]} hover:shadow-2xl transition-all duration-300 hover:scale-105`}
              >
                {/* Rarity Label */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    badge.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                    badge.rarity === 'epic' ? 'bg-purple-500 text-white' :
                    badge.rarity === 'rare' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {rarityLabels[badge.rarity]}
                  </span>
                  {badge.verified && (
                    <FaCheckCircle className="text-green-500 text-xl" />
                  )}
                </div>

                {/* Badge Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-white text-4xl shadow-xl group-hover:scale-110 transition-transform`}>
                    <Icon />
                  </div>
                </div>

                {/* Badge Info */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  {badge.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                  {badge.description}
                </p>

                {/* Earned Date */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <FaCertificate />
                  <span>Earned {new Date(badge.earnedDate).toLocaleDateString()}</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Selected Badge Modal */}
        <AnimatePresence>
          {selectedBadge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedBadge(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-2xl w-full"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedBadge.color} flex items-center justify-center text-white text-3xl`}>
                      {<selectedBadge.icon />}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {selectedBadge.name}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedBadge.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                        selectedBadge.rarity === 'epic' ? 'bg-purple-500 text-white' :
                        selectedBadge.rarity === 'rare' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {rarityLabels[selectedBadge.rarity]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBadge(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {selectedBadge.description}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <FaCheckCircle className="text-green-500 text-2xl" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Blockchain Verified</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        This credential is permanently stored on the blockchain
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/30 dark:bg-white/[0.01] backdrop-blur-sm rounded-xl">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Blockchain Hash:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                      {selectedBadge.blockchainHash}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Earned Date</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {new Date(selectedBadge.earnedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Category</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {selectedBadge.category}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg"
                  >
                    <FaDownload /> Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg"
                  >
                    <FaShareAlt /> Share
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg"
                  >
                    <FaLink />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
