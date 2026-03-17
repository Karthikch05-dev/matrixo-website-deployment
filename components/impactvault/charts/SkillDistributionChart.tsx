'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SkillFrequency } from '@/lib/impactvault/types';

interface Props {
  data: SkillFrequency[];
  maxItems?: number;
}

const COLORS = [
  '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
];

export default function SkillDistributionChart({ data, maxItems = 10 }: Props) {
  const chartData = data.slice(0, maxItems).map((item) => ({
    name: item.skill.length > 14 ? item.skill.slice(0, 12) + '...' : item.skill,
    fullName: item.skill,
    students: item.count,
    avgScore: item.avgScore,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        No skill data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          angle={-45}
          textAnchor="end"
          height={70}
        />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '13px',
          }}
          formatter={(value, name) => {
            if (name === 'students') return [`${value} students`, 'Students'];
            return [`${value}%`, 'Avg Score'];
          }}
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload;
            return item?.fullName || label;
          }}
        />
        <Bar dataKey="students" radius={[6, 6, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
