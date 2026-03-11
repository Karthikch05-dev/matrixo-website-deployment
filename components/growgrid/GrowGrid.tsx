'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaRocket, FaCode, FaPalette, FaChartLine, FaMicrophone, FaLock, FaCheckCircle, FaPlay, FaClock, FaStar, FaTrophy } from 'react-icons/fa'
import Link from 'next/link'

interface Module {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon: any
  locked: boolean
  completed: boolean
  progress: number
  xp: number
}

interface LearningPath {
  id: string
  name: string
  description: string
  color: string
  icon: any
  totalModules: number
  completedModules: number
  estimatedTime: string
  xpReward: number
}

const learningPaths: LearningPath[] = [
  {
    id: 'web-dev',
    name: 'Full-Stack Web Development',
    description: 'Master modern web development from frontend to backend',
    color: 'from-blue-500 to-cyan-500',
    icon: FaCode,
    totalModules: 12,
    completedModules: 3,
    estimatedTime: '8 weeks',
    xpReward: 2400,
  },
  {
    id: 'ui-design',
    name: 'UI/UX Design Mastery',
    description: 'Create stunning user experiences and interfaces',
    color: 'from-purple-500 to-pink-500',
    icon: FaPalette,
    totalModules: 10,
    completedModules: 0,
    estimatedTime: '6 weeks',
    xpReward: 2000,
  },
  {
    id: 'data-science',
    name: 'Data Science & Analytics',
    description: 'Unlock insights from data with AI and ML',
    color: 'from-green-500 to-emerald-500',
    icon: FaChartLine,
    totalModules: 15,
    completedModules: 0,
    estimatedTime: '10 weeks',
    xpReward: 3000,
  },
]

const sampleModules: Module[] = [
  {
    id: 'mod1',
    title: 'HTML & CSS Fundamentals',
    description: 'Learn the building blocks of web pages',
    duration: '2 hours',
    difficulty: 'beginner',
    icon: FaCode,
    locked: false,
    completed: true,
    progress: 100,
    xp: 200,
  },
  {
    id: 'mod2',
    title: 'JavaScript Basics',
    description: 'Master the language of the web',
    duration: '3 hours',
    difficulty: 'beginner',
    icon: FaCode,
    locked: false,
    completed: true,
    progress: 100,
    xp: 250,
  },
  {
    id: 'mod3',
    title: 'React Framework',
    description: 'Build dynamic user interfaces',
    duration: '4 hours',
    difficulty: 'intermediate',
    icon: FaCode,
    locked: false,
    completed: false,
    progress: 65,
    xp: 350,
  },
  {
    id: 'mod4',
    title: 'Next.js & Server Components',
    description: 'Advanced React patterns',
    duration: '5 hours',
    difficulty: 'intermediate',
    icon: FaCode,
    locked: false,
    completed: false,
    progress: 0,
    xp: 400,
  },
  {
    id: 'mod5',
    title: 'Backend with Node.js',
    description: 'Build powerful server applications',
    duration: '6 hours',
    difficulty: 'intermediate',
    icon: FaCode,
    locked: true,
    completed: false,
    progress: 0,
    xp: 450,
  },
  {
    id: 'mod6',
    title: 'Database Design & SQL',
    description: 'Store and query data effectively',
    duration: '4 hours',
    difficulty: 'intermediate',
    icon: FaChartLine,
    locked: true,
    completed: false,
    progress: 0,
    xp: 400,
  },
]

export default function GrowGrid() {
  const [selectedPath, setSelectedPath] = useState<string>(learningPaths[0].id)
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)

  const currentPath = learningPaths.find(p => p.id === selectedPath)!
  const totalXP = 1250
  const currentLevel = Math.floor(totalXP / 500) + 1

  const difficultyColors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 py-20">
      <div className="container-custom px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full mb-4">
            <FaRocket className="animate-bounce" />
            <span className="font-bold">GrowGrid™ Learning Paths</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Your Adaptive Learning Journey
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Personalized micro-modules that adapt to your pace and style
          </p>
        </motion.div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaTrophy className="text-3xl text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Level {currentLevel}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current Level</p>
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500" style={{ width: `${(totalXP % 500) / 5}%` }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{totalXP % 500}/500 XP to next level</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaStar className="text-3xl text-purple-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalXP}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total XP Earned</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaCheckCircle className="text-3xl text-green-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">8/30</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Modules Completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FaClock className="text-3xl text-blue-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">24h</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Learning Time</p>
          </motion.div>
        </div>

        {/* Learning Paths Selection */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose Your Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learningPaths.map((path, index) => {
              const Icon = path.icon
              const progress = (path.completedModules / path.totalModules) * 100
              
              return (
                <motion.button
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => setSelectedPath(path.id)}
                  className={`text-left p-6 rounded-2xl transition-all duration-300 ${
                    selectedPath === path.id
                      ? 'bg-white/50 dark:bg-white/[0.03] backdrop-blur-md shadow-2xl scale-105'
                      : 'bg-white/50 dark:bg-gray-800/50 shadow-lg hover:shadow-xl hover:scale-102'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${path.color} flex items-center justify-center text-white text-2xl mb-4`}>
                    <Icon />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{path.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{path.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-bold text-gray-900 dark:text-white">{path.completedModules}/{path.totalModules}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${path.color}`} style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>⏱️ {path.estimatedTime}</span>
                      <span>⭐ {path.xpReward} XP</span>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Current Path Modules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-3xl shadow-2xl p-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {currentPath.name} Modules
          </h2>

          <div className="space-y-4">
            {sampleModules.map((module, index) => {
              const Icon = module.icon
              
              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                  onHoverStart={() => setHoveredModule(module.id)}
                  onHoverEnd={() => setHoveredModule(null)}
                  className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                    module.locked
                      ? 'border-gray-200/30 dark:border-white/[0.06] bg-white/30 dark:bg-white/[0.01] backdrop-blur-sm opacity-60'
                      : module.completed
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Module Icon */}
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl transition-transform ${
                      module.locked ? 'bg-gray-400' : `bg-gradient-to-br ${currentPath.color}`
                    } ${hoveredModule === module.id && !module.locked ? 'scale-110' : ''}`}>
                      {module.locked ? <FaLock /> : module.completed ? <FaCheckCircle /> : <Icon />}
                    </div>

                    {/* Module Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{module.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{module.description}</p>
                        </div>
                        {!module.locked && !module.completed && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-full hover:shadow-lg"
                          >
                            <FaPlay />
                          </motion.button>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <FaClock /> {module.duration}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-white text-xs font-bold ${difficultyColors[module.difficulty]}`}>
                          {module.difficulty}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" /> {module.xp} XP
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {!module.locked && module.progress > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span className="font-bold">{module.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full bg-gradient-to-r ${currentPath.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${module.progress}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
