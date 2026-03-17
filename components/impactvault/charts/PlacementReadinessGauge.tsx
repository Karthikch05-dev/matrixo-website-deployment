'use client';

import { motion } from 'framer-motion';

interface Props {
  score: number;       // 0-100
  label: string;
  size?: number;
}

export default function PlacementReadinessGauge({ score, label, size = 180 }: Props) {
  const radius = (size - 20) / 2;
  const center = size / 2;
  const strokeWidth = 14;

  // Arc from 225° to -45° (270° sweep)
  const startAngle = 225;
  const endAngle = -45;
  const totalAngle = startAngle - endAngle; // 270

  const scoreAngle = startAngle - (score / 100) * totalAngle;

  const polarToCartesian = (angle: number) => {
    const rads = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rads),
      y: center - radius * Math.sin(rads),
    };
  };

  const describeArc = (startA: number, endA: number) => {
    const start = polarToCartesian(startA);
    const end = polarToCartesian(endA);
    const sweep = startA - endA;
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const getColor = (s: number) => {
    if (s >= 70) return '#10b981';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.75}`}>
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="rgba(128,128,128,0.15)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        {score > 0 && (
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            d={describeArc(startAngle, scoreAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          className="fill-gray-900 dark:fill-white"
          fontSize="28"
          fontWeight="bold"
        >
          {score}%
        </text>
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          className="fill-gray-500 dark:fill-gray-400"
          fontSize="11"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
