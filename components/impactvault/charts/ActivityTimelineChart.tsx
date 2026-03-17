'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ReadinessBucket } from '@/lib/impactvault/types';

interface Props {
  data: ReadinessBucket[];
}

export default function ActivityTimelineChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        No activity data available
      </div>
    );
  }

  const chartData = data.map((bucket) => ({
    range: bucket.range + '%',
    students: bucket.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
        <XAxis
          dataKey="range"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
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
          formatter={(value) => [`${value} students`, 'Students']}
        />
        <Area
          type="monotone"
          dataKey="students"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#readinessGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
