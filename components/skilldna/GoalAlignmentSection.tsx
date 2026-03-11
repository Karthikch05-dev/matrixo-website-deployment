// ============================================================
// GoalAlignmentSection — Goal Alignment Intelligence panel
// Shows per-goal roadmaps with:
//   Match %, Skills You Have, Skills Missing,
//   Priority Next Skill, Skill Depth Required
// Color-coded: Green = Strong, Yellow = Developing, Red = Critical
// ============================================================

'use client';

import { motion } from 'framer-motion';
import {
  FaBullseye,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { useState } from 'react';
import {
  GoalIntelligenceResult,
  GoalRoadmap,
  getStatusColor,
  getStatusBgColor,
  getMatchGradient,
  getTierLabel,
  GoalTier,
} from '@/lib/skilldna/services/goal-intelligence-engine';

interface GoalAlignmentSectionProps {
  intelligence: GoalIntelligenceResult;
}

function GoalTierCard({ roadmap }: { roadmap: GoalRoadmap }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(roadmap.status);
  const bgColor = getStatusBgColor(roadmap.status);
  const gradient = getMatchGradient(roadmap.status);

  if (!roadmap.goalText.trim()) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 transition-all ${bgColor}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaBullseye className={statusColor} size={14} />
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {getTierLabel(roadmap.tier)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-black ${statusColor}`}>
            {roadmap.matchPercent}%
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
            roadmap.status === 'strong'
              ? 'bg-green-500/20 text-green-400'
              : roadmap.status === 'developing'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {roadmap.status}
          </span>
        </div>
      </div>

      {/* Goal text */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
        &ldquo;{roadmap.goalText}&rdquo;
      </p>

      {/* Match bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: roadmap.matchPercent + '%' }}
          transition={{ duration: 0.8 }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{roadmap.totalOwned}</p>
          <p className="text-[10px] text-gray-500">Skills You Have</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-400">{roadmap.missingSkills.length}</p>
          <p className="text-[10px] text-gray-500">Skills Missing</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{roadmap.totalRequired}</p>
          <p className="text-[10px] text-gray-500">Total Required</p>
        </div>
      </div>

      {/* Priority Next Skill */}
      {roadmap.priorityNextSkill && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-3">
          <FaArrowRight className="text-purple-400 flex-shrink-0" size={10} />
          <span className="text-xs text-purple-300 font-medium">
            Priority Next Skill: <span className="text-white font-bold">{roadmap.priorityNextSkill}</span>
          </span>
        </div>
      )}

      {/* Expand / Collapse Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
      >
        {expanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
        {expanded ? 'Hide Details' : 'Show Details'}
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-2"
        >
          {/* Matched skills */}
          {roadmap.matchedSkills.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Skills You Have</p>
              <div className="flex flex-wrap gap-1.5">
                {roadmap.matchedSkills.map(function(skill) {
                  return (
                    <span key={skill} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                      <FaCheckCircle size={8} /> {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {roadmap.missingSkills.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Missing Skills</p>
              <div className="space-y-1.5">
                {roadmap.missingSkills.map(function(ms) {
                  return (
                    <div key={ms.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/40 border border-gray-700/30">
                      <div className="flex items-center gap-2">
                        <FaTimesCircle className="text-red-400 flex-shrink-0" size={9} />
                        <span className="text-xs text-gray-300 font-medium">{ms.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          ms.effort === 'Low'
                            ? 'bg-green-500/15 text-green-400'
                            : ms.effort === 'Medium'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {ms.effort} Effort
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-medium">
                          {ms.recommendedDepth}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function GoalAlignmentSection({ intelligence }: GoalAlignmentSectionProps) {
  var overallStatusColor = getStatusColor(intelligence.overallStatus);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaBullseye className="text-green-400" />
          Goal Alignment Intelligence
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black ${overallStatusColor}`}>
            {intelligence.overallMatchPercent}%
          </span>
          <span className="text-xs text-gray-500">Overall Match</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Strong (65%+)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> Developing (35-64%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Critical (&lt;35%)
        </span>
      </div>

      {/* Goal tier cards */}
      <div className="space-y-4">
        <GoalTierCard roadmap={intelligence.shortTerm} />
        <GoalTierCard roadmap={intelligence.midTerm} />
        <GoalTierCard roadmap={intelligence.longTerm} />
      </div>
    </div>
  );
}
