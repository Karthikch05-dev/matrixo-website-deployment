'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBrain, FaCode, FaPalette, FaChartLine, FaMicrophone, FaRocket } from 'react-icons/fa'

interface Question {
  id: number
  question: string
  category: string
  options: { value: string; label: string; icon: any }[]
}

const questions: Question[] = [
  {
    id: 1,
    category: 'Learning Style',
    question: 'How do you prefer to learn new concepts?',
    options: [
      { value: 'visual', label: 'Visual (Videos, Diagrams)', icon: FaPalette },
      { value: 'hands-on', label: 'Hands-on Practice', icon: FaCode },
      { value: 'reading', label: 'Reading & Research', icon: FaBrain },
      { value: 'discussion', label: 'Discussion & Collaboration', icon: FaMicrophone },
    ],
  },
  {
    id: 2,
    category: 'Interest Areas',
    question: 'Which field excites you the most?',
    options: [
      { value: 'tech', label: 'Technology & Programming', icon: FaCode },
      { value: 'design', label: 'Design & Creativity', icon: FaPalette },
      { value: 'business', label: 'Business & Analytics', icon: FaChartLine },
      { value: 'innovation', label: 'Innovation & Startups', icon: FaRocket },
    ],
  },
  {
    id: 3,
    category: 'Skill Level',
    question: 'What best describes your current experience?',
    options: [
      { value: 'beginner', label: 'Just Starting Out', icon: FaRocket },
      { value: 'intermediate', label: 'Building Skills', icon: FaChartLine },
      { value: 'advanced', label: 'Experienced Learner', icon: FaBrain },
      { value: 'expert', label: 'Industry Ready', icon: FaCode },
    ],
  },
]

export default function SkillDNAAssessment({ onComplete }: { onComplete?: (data: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value })
    
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300)
    } else {
      // Complete assessment
      setIsAnalyzing(true)
      setTimeout(() => {
        onComplete?.(answers)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-20">
      <div className="container-custom px-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-6 py-2 rounded-full mb-4">
            <FaBrain className="animate-pulse" />
            <span className="font-bold">SkillDNA™ Assessment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Discover Your Learning Genome
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Let's map your unique skill DNA in just 3 minutes
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Question {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isAnalyzing ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12"
            >
              {/* Category Badge */}
              <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-6">
                {currentQuestion.category}
              </div>

              {/* Question */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-6 rounded-2xl border-2 border-gray-200/30 dark:border-white/[0.06] hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 text-left bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                        <option.icon />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-3xl shadow-2xl p-12 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
                <FaBrain className="text-4xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Analyzing Your SkillDNA™...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Mapping your unique learning genome
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
