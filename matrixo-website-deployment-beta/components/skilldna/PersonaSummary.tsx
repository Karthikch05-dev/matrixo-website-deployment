// ============================================================
// SkillDNA AI Persona Summary
// Personalized AI-generated identity card
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { FaUser, FaStar, FaArrowUp, FaBriefcase, FaBrain } from 'react-icons/fa';
import { AIPersonaSummary } from '@/lib/skilldna/types';

interface PersonaSummaryProps {
  persona: AIPersonaSummary;
}

export default function PersonaSummary({ persona }: PersonaSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-100/40 via-white to-blue-100/40 dark:from-purple-900/40 dark:via-gray-900 dark:to-blue-900/40 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 md:p-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <FaBrain className="text-purple-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Persona Summary</h3>
      </div>

      {/* Headline */}
      <div className="mb-6">
        <h4 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          {persona.headline}
        </h4>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {persona.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personality Type */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <FaUser />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Personality Type</p>
            <p className="text-gray-900 dark:text-white font-semibold">{persona.personalityType}</p>
          </div>
        </div>

        {/* Career Fit */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <FaBriefcase />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Career Fit</p>
            <div className="flex flex-wrap gap-1.5">
              {persona.careerFit.map((fit) => (
                <span key={fit} className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {fit}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
            <FaStar />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Key Strengths</p>
            <ul className="space-y-1">
              {persona.strengths.map((s) => (
                <li key={s} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="text-green-400 text-xs">+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Growth Areas */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <FaArrowUp />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Areas for Growth</p>
            <ul className="space-y-1">
              {persona.areasForGrowth.map((a) => (
                <li key={a} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="text-amber-400 text-xs">→</span> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
