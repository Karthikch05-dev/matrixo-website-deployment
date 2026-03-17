'use client';

import { motion } from 'framer-motion';
import { FaUsers, FaDna, FaTrophy, FaChevronRight } from 'react-icons/fa';
import { DepartmentMetrics } from '@/lib/impactvault/types';
import DepartmentComparisonChart from './charts/DepartmentComparisonChart';

interface Props {
  departments: DepartmentMetrics[];
}

export default function DepartmentAnalytics({ departments }: Props) {
  if (departments.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-gray-400 dark:text-gray-500">No department data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Department Comparison Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Department Comparison
        </h3>
        <DepartmentComparisonChart departments={departments} />
      </motion.div>

      {/* Department Rankings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Department Performance Ranking
        </h3>

        <div className="space-y-4">
          {departments.map((dept, index) => (
            <motion.div
              key={dept.department}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/30 dark:bg-white/[0.02] border border-gray-200/20 dark:border-white/[0.04] hover:bg-white/50 dark:hover:bg-white/[0.04] transition-colors"
            >
              {/* Rank */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    : index === 1
                    ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                    : index === 2
                    ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600'
                }`}
              >
                #{index + 1}
              </div>

              {/* Department Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {dept.department}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <FaUsers className="text-blue-500" /> {dept.studentCount} students
                  </span>
                  <span className="flex items-center gap-1">
                    <FaDna className="text-purple-500" /> {dept.studentsWithSkillDNA} profiles
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="hidden sm:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {dept.avgDynamicSkillScore}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Skill Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {dept.avgHiringReadiness}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Hiring Ready</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {dept.avgCareerAlignment}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Career Align</div>
                </div>
              </div>

              {/* Top Skills */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                {dept.topSkills.slice(0, 3).map((skill) => (
                  <span
                    key={skill.skill}
                    className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs"
                  >
                    {skill.skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
