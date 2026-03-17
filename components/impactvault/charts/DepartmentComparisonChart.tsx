'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { DepartmentMetrics } from '@/lib/impactvault/types';

interface Props {
  departments: DepartmentMetrics[];
  maxDepartments?: number;
}

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function DepartmentComparisonChart({ departments, maxDepartments = 6 }: Props) {
  const depts = departments.slice(0, maxDepartments);

  if (depts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        No department data available
      </div>
    );
  }

  // Build radar data: each metric is a dimension, each department is a series
  const metrics = [
    { key: 'avgDynamicSkillScore', label: 'Skill Score', max: 1000 },
    { key: 'avgHiringReadiness', label: 'Hiring Readiness', max: 100 },
    { key: 'avgCareerAlignment', label: 'Career Alignment', max: 100 },
  ] as const;

  const radarData = metrics.map((metric) => {
    const point: Record<string, string | number> = { metric: metric.label };
    depts.forEach((dept) => {
      const raw = dept[metric.key] as number;
      // Normalize all to 0-100 scale for comparison
      point[dept.department] = metric.max === 1000 ? Math.round(raw / 10) : Math.round(raw);
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(128,128,128,0.2)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#6b7280' }}
        />
        {depts.map((dept, index) => (
          <Radar
            key={dept.department}
            name={dept.department}
            dataKey={dept.department}
            stroke={COLORS[index % COLORS.length]}
            fill={COLORS[index % COLORS.length]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '13px',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
