// ============================================================
// SkillDNA™ Learning Paths Section
// AI-recommended learning journeys
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { FaGraduationCap, FaClock, FaSignal, FaCode } from 'react-icons/fa';
import { LearningPath } from '@/lib/skilldna/types';

interface LearningPathsSectionProps {
  paths: LearningPath[];
}

const difficultyColors = {
  beginner: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20' },
  intermediate: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20' },
  advanced: { bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20' },
  expert: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20' },
};

export default function LearningPathsSection({ paths }: LearningPathsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <FaGraduationCap className="text-blue-400" />
          Recommended Learning Paths
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          AI-curated learning journeys based on your SkillDNA profile
        </p>

        <div className="space-y-6">
          {paths.map((path, i) => {
            const colors = difficultyColors[path.difficulty] || difficultyColors.intermediate;

            return (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`p-6 rounded-xl border ${colors.bg}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{path.title}</h4>
                    <p className="text-sm text-gray-400">{path.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${colors.badge} ${colors.text}`}>
                      <FaSignal className="inline mr-1" />
                      {path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1)}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                      <FaClock className="inline mr-1" />
                      {path.estimatedDuration}
                    </span>
                  </div>
                </div>

                {/* Steps */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Learning Steps</p>
                  <div className="space-y-2">
                    {path.steps.map((step, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
                          {j + 1}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Skills */}
                {path.relatedSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <FaCode className="text-[10px]" /> Related Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {path.relatedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
