// ============================================================
// SkillDNAâ„¢ Skill Gap Cards
// Visual representation of skill gaps with priorities
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaExclamationCircle, FaInfoCircle, FaBook } from 'react-icons/fa';
import { SkillGap } from '@/lib/skilldna/types';

interface SkillGapCardsProps {
  gaps: SkillGap[];
}

const priorityConfig = {
  high: {
    icon: FaExclamationTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/30',
    badge: 'bg-red-500/20 text-red-400',
    barCurrent: 'from-red-500 to-red-600',
    barRequired: 'from-red-300/20 to-red-500/20',
  },
  medium: {
    icon: FaExclamationCircle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-400',
    barCurrent: 'from-yellow-500 to-amber-500',
    barRequired: 'from-yellow-300/20 to-yellow-500/20',
  },
  low: {
    icon: FaInfoCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400',
    barCurrent: 'from-blue-500 to-cyan-500',
    barRequired: 'from-blue-300/20 to-blue-500/20',
  },
};

export default function SkillGapCards({ gaps }: SkillGapCardsProps) {
  // Sort by priority: high > medium > low
  const sortedGaps = [...gaps].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-4">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Skill Gap Analysis</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Areas where you need improvement to reach your career goals
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedGaps.map((gap, i) => {
            const config = priorityConfig[gap.priority];
            const Icon = config.icon;
            const gapPercent = gap.requiredLevel - gap.currentLevel;

            return (
              <motion.div
                key={gap.skill}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-5 rounded-xl border ${config.bg}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={config.color} />
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{gap.skill}</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
                    {gap.priority.toUpperCase()}
                  </span>
                </div>

                {/* Gap bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Current: {gap.currentLevel}%</span>
                    <span className="text-gray-600 dark:text-gray-400">Required: {gap.requiredLevel}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Required level marker */}
                    <div
                      className={`absolute h-full bg-gradient-to-r ${config.barRequired} rounded-full`}
                      style={{ width: `${gap.requiredLevel}%` }}
                    />
                    {/* Current level */}
                    <motion.div
                      className={`h-full bg-gradient-to-r ${config.barCurrent} rounded-full relative z-10`}
                      initial={{ width: 0 }}
                      animate={{ width: `${gap.currentLevel}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Gap: <span className={config.color}>{gapPercent}%</span> to close
                  </p>
                </div>

                {/* Resources */}
                {gap.suggestedResources.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <FaBook className="text-[10px]" /> Suggested Resources
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {gap.suggestedResources.map((resource) => (
                        <span
                          key={resource}
                          className="text-xs px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                        >
                          {resource}
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
