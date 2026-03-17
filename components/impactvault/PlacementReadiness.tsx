'use client';

import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaSeedling, FaTrophy, FaChartBar } from 'react-icons/fa';
import { PlacementMetrics, StudentAnalytics } from '@/lib/impactvault/types';
import PlacementReadinessGauge from './charts/PlacementReadinessGauge';
import ActivityTimelineChart from './charts/ActivityTimelineChart';

interface Props {
  metrics: PlacementMetrics;
}

export default function PlacementReadiness({ metrics }: Props) {
  return (
    <div className="space-y-8">
      {/* Top Row: Gauge + Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 flex flex-col items-center justify-center"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Overall Readiness
          </h3>
          <PlacementReadinessGauge
            score={metrics.overallReadinessScore}
            label="Placement Ready"
          />
        </motion.div>

        {/* Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatusCard
            icon={FaCheckCircle}
            label="Placement Ready"
            count={metrics.readyCount}
            description="Hiring readiness ≥ 70%"
            color="text-green-500"
            bg="bg-green-100 dark:bg-green-900/20"
          />
          <StatusCard
            icon={FaClock}
            label="Developing"
            count={metrics.developingCount}
            description="Hiring readiness 40-69%"
            color="text-yellow-500"
            bg="bg-yellow-100 dark:bg-yellow-900/20"
          />
          <StatusCard
            icon={FaSeedling}
            label="Early Stage"
            count={metrics.earlyStageCount}
            description="Hiring readiness < 40%"
            color="text-red-500"
            bg="bg-red-100 dark:bg-red-900/20"
          />
        </motion.div>
      </div>

      {/* Readiness Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Readiness Score Distribution
        </h3>
        <ActivityTimelineChart data={metrics.readinessDistribution} />
      </motion.div>

      {/* Top Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <FaTrophy className="text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Top Placement Candidates
          </h3>
        </div>

        <div className="space-y-3">
          {metrics.topCandidates.map((candidate, index) => (
            <CandidateRow key={candidate.uid} candidate={candidate} rank={index + 1} />
          ))}
        </div>

        {metrics.topCandidates.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            No candidates with SkillDNA profiles available
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  count,
  description,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`${color} text-lg`} />
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{count}</div>
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</div>
    </div>
  );
}

function CandidateRow({ candidate, rank }: { candidate: StudentAnalytics; rank: number }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${
          rank <= 3
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
            : 'bg-gradient-to-br from-emerald-500 to-green-600'
        }`}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
          {candidate.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {candidate.branch} • {candidate.skillCount} skills
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {candidate.hiringReadiness}%
          </div>
          <div className="text-xs text-gray-400">Ready</div>
        </div>
        <div className="text-center hidden sm:block">
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {candidate.dynamicSkillScore}
          </div>
          <div className="text-xs text-gray-400">Score</div>
        </div>
      </div>

      {candidate.topSkills.length > 0 && (
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {candidate.topSkills.slice(0, 2).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
