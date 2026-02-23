// ============================================================
// SkillDNA™ Career Alignment Progress Bars
// Multi-dimensional career alignment visualization
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { getScoreGradient, getScoreColor } from '@/lib/skilldna/scoring';

interface CareerAlignmentBarProps {
  score: number;
  cognitiveScore: number;
  learningVelocity: number;
}

export default function CareerAlignmentBar({ score, cognitiveScore, learningVelocity }: CareerAlignmentBarProps) {
  const metrics = [
    { label: 'Career Alignment', value: score, description: 'How well your skills align with your career goals' },
    { label: 'Cognitive Ability', value: cognitiveScore, description: 'Problem-solving, creativity, and analytical thinking' },
    { label: 'Learning Velocity', value: learningVelocity, description: 'Speed of acquiring and applying new skills' },
  ];

  return (
    <div className="space-y-6">
      {metrics.map((metric, i) => (
        <div key={metric.label}>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">{metric.label}</p>
              <p className="text-xs text-gray-500">{metric.description}</p>
            </div>
            <span className={`text-xl font-bold ${getScoreColor(metric.value)}`}>
              {metric.value}%
            </span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
            <motion.div
              className={`h-full bg-gradient-to-r ${getScoreGradient(metric.value)} rounded-full relative`}
              initial={{ width: 0 }}
              animate={{ width: `${metric.value}%` }}
              transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 2, delay: 1 + i * 0.2, repeat: 1 }}
              />
            </motion.div>
            
            {/* Milestone markers */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute top-0 bottom-0 w-px bg-gray-700"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
