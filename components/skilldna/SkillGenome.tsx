'use client'

import { motion } from 'framer-motion'
import { FaBrain, FaChartLine, FaCode, FaPalette, FaMicrophone, FaRocket, FaTrophy, FaFire } from 'react-icons/fa'
import { useState } from 'react'

interface SkillGenomeProps {
  data: Record<number, string>
}

const skillCategories = [
  { id: 'technical', name: 'Technical Skills', icon: FaCode, color: 'from-blue-500 to-cyan-500' },
  { id: 'creative', name: 'Creative Thinking', icon: FaPalette, color: 'from-purple-500 to-pink-500' },
  { id: 'analytical', name: 'Analytical Mind', icon: FaChartLine, color: 'from-green-500 to-emerald-500' },
  { id: 'communication', name: 'Communication', icon: FaMicrophone, color: 'from-orange-500 to-red-500' },
  { id: 'innovation', name: 'Innovation', icon: FaRocket, color: 'from-indigo-500 to-purple-500' },
]

export default function SkillGenome({ data }: SkillGenomeProps) {
  // Simulate AI-generated skill scores based on answers
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)

  // Generate skill scores (in real implementation, this would come from AI backend)
  const skillScores = {
    technical: Math.random() * 40 + 60,
    creative: Math.random() * 40 + 60,
    analytical: Math.random() * 40 + 60,
    communication: Math.random() * 40 + 60,
    innovation: Math.random() * 40 + 60,
  }

  const learnerType = data[1] || 'visual'
  const interestArea = data[2] || 'tech'
  const experienceLevel = data[3] || 'intermediate'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-20">
      <div className="container-custom px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full mb-4">
            <FaTrophy className="animate-bounce" />
            <span className="font-bold">Your SkillDNA™ Results</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Your Learning Genome Mapped
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Based on cutting-edge AI analysis, here's your personalized skill profile
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                <FaBrain />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Learning Style</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">{learnerType}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <FaRocket />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Interest Area</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">{interestArea}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                <FaFire />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Experience</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">{experienceLevel}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Skill Genome Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Your Skill DNA Map
          </h2>

          <div className="space-y-6">
            {skillCategories.map((category, index) => {
              const score = skillScores[category.id as keyof typeof skillScores]
              const Icon = category.icon
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="group"
                  onHoverStart={() => setSelectedSkill(category.id)}
                  onHoverEnd={() => setSelectedSkill(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        <Icon />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {Math.round(score)}%
                    </span>
                  </div>
                  
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${category.color} relative`}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    >
                      {selectedSkill === category.id && (
                        <motion.div
                          className="absolute inset-0 bg-white/30"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recommended Paths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl shadow-2xl p-8 md:p-12 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Your Personalized Learning Path</h2>
          <p className="text-lg text-white/90 mb-6">
            Based on your SkillDNA™, we've curated the perfect learning journey for you
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-shadow"
          >
            Start Your GrowGrid™ Journey →
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
