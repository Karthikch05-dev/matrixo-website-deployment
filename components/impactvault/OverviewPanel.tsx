'use client';

import { motion } from 'framer-motion';
import { FaUsers, FaDna, FaTrophy, FaBrain, FaRocket, FaGraduationCap, FaArrowUp } from 'react-icons/fa';
import { InstitutionMetrics, AggregatedSkillGap } from '@/lib/impactvault/types';
import SkillDistributionChart from './charts/SkillDistributionChart';

interface Props {
  metrics: InstitutionMetrics;
}

const metricCards = [
  {
    key: 'totalStudents' as const,
    label: 'Total Students',
    icon: FaUsers,
    gradient: 'from-blue-500 to-cyan-500',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'studentsWithSkillDNA' as const,
    label: 'SkillDNA Profiles',
    icon: FaDna,
    gradient: 'from-purple-500 to-pink-500',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'avgDynamicSkillScore' as const,
    label: 'Avg Skill Score',
    icon: FaTrophy,
    gradient: 'from-green-500 to-emerald-500',
    format: (v: number) => `${v}/1000`,
  },
  {
    key: 'avgHiringReadiness' as const,
    label: 'Avg Hiring Readiness',
    icon: FaRocket,
    gradient: 'from-orange-500 to-red-500',
    format: (v: number) => `${v}%`,
  },
  {
    key: 'avgCognitiveScore' as const,
    label: 'Avg Cognitive Score',
    icon: FaBrain,
    gradient: 'from-indigo-500 to-purple-500',
    format: (v: number) => `${v}%`,
  },
  {
    key: 'departmentCount' as const,
    label: 'Departments',
    icon: FaGraduationCap,
    gradient: 'from-teal-500 to-green-500',
    format: (v: number) => v.toString(),
  },
];

export default function OverviewPanel({ metrics }: Props) {
  return (
    <div className="space-y-8">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const value = metrics[card.key];
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white text-xl`}
                >
                  <Icon />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {card.format(value)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Skill Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Top Skills Across Institution
        </h3>
        <SkillDistributionChart data={metrics.topSkills} />
      </motion.div>

      {/* Skill Gaps */}
      {metrics.skillGapsSummary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Skill Gap Analysis
          </h3>
          <div className="space-y-4">
            {metrics.skillGapsSummary.map((gap) => (
              <SkillGapRow key={gap.skill} gap={gap} maxStudents={metrics.studentsWithSkillDNA} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SkillGapRow({ gap, maxStudents }: { gap: AggregatedSkillGap; maxStudents: number }) {
  const percentage = maxStudents > 0 ? (gap.studentsAffected / maxStudents) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900 dark:text-white">{gap.skill}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {gap.studentsAffected} students
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              gap.priority === 'high'
                ? 'bg-red-500'
                : gap.priority === 'medium'
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${
          gap.priority === 'high'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            : gap.priority === 'medium'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        }`}
      >
        {gap.priority}
      </span>
    </div>
  );
}
