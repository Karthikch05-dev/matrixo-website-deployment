// ============================================================
// SkillDNA™ Dynamic Score Meter
// Animated gauge visualization for 0-1000 score
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { getScoreGrade } from '@/lib/skilldna/scoring';

interface DynamicScoreMeterProps {
  score: number;
}

export default function DynamicScoreMeter({ score }: DynamicScoreMeterProps) {
  const percentage = (score / 1000) * 100;
  const grade = getScoreGrade(score, 1000);

  // SVG arc calculation
  const radius = 120;
  const strokeWidth = 16;
  const center = 140;
  const startAngle = -210;
  const endAngle = 30;
  const totalAngle = endAngle - startAngle; // 240 degrees
  const scoreAngle = startAngle + (totalAngle * percentage) / 100;

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const startPoint = polarToCartesian(cx, cy, r, start);
    const endPoint = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  };

  // Color based on score
  const getColor = () => {
    if (percentage >= 80) return { main: '#10B981', glow: '#10B98140' };
    if (percentage >= 60) return { main: '#3B82F6', glow: '#3B82F640' };
    if (percentage >= 40) return { main: '#F59E0B', glow: '#F59E0B40' };
    if (percentage >= 20) return { main: '#F97316', glow: '#F9731640' };
    return { main: '#EF4444', glow: '#EF444440' };
  };

  const color = getColor();

  // Tier markers
  const tiers = [
    { score: 0, label: '0' },
    { score: 250, label: '250' },
    { score: 500, label: '500' },
    { score: 750, label: '750' },
    { score: 1000, label: '1000' },
  ];

  return (
    <div className="flex flex-col items-center">
      <svg width="280" height="200" viewBox="0 0 280 200" className="overflow-visible">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={describeArc(center, center, radius, startAngle, endAngle)}
          fill="none"
          stroke="#1F2937"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Score arc */}
        <motion.path
          d={describeArc(center, center, radius, startAngle, scoreAngle)}
          fill="none"
          stroke={color.main}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Tier markers */}
        {tiers.map((tier) => {
          const angle = startAngle + (totalAngle * tier.score) / 1000;
          const pos = polarToCartesian(center, center, radius + 22, angle);
          return (
            <text
              key={tier.score}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6B7280"
              fontSize="10"
              fontWeight="500"
            >
              {tier.label}
            </text>
          );
        })}

        {/* Center score text */}
        <motion.text
          x={center}
          y={center - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="42"
          fontWeight="900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.text>
        <text
          x={center}
          y={center + 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9CA3AF"
          fontSize="13"
          fontWeight="500"
        >
          / 1000
        </text>
      </svg>

      {/* Grade Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-2 px-6 py-2 rounded-full font-bold text-sm"
        style={{ 
          backgroundColor: color.glow, 
          color: color.main,
          border: `1px solid ${color.main}40`,
        }}
      >
        {grade}
      </motion.div>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-2 mt-6 text-center">
        {[
          { range: '0-200', label: 'Novice', active: score <= 200 },
          { range: '200-400', label: 'Emerging', active: score > 200 && score <= 400 },
          { range: '400-600', label: 'Proficient', active: score > 400 && score <= 600 },
          { range: '600-800', label: 'Advanced', active: score > 600 && score <= 800 },
          { range: '800-900', label: 'Expert', active: score > 800 && score <= 900 },
          { range: '900-1000', label: 'Exceptional', active: score > 900 },
        ].map((tier) => (
          <div key={tier.range} className={`text-xs ${tier.active ? 'text-purple-400 font-bold' : 'text-gray-600'}`}>
            <p className="font-mono">{tier.range}</p>
            <p>{tier.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
