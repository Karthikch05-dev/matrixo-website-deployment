// ============================================================
// SkillDNA™ Radar Chart (Recharts)
// Circular skill radar visualization
// ============================================================

'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { TechnicalSkill } from '@/lib/skilldna/types';

interface SkillRadarChartProps {
  skills: TechnicalSkill[];
}

export default function SkillRadarChart({ skills }: SkillRadarChartProps) {
  // Take top 8 skills for radar chart readability
  const chartData = skills.slice(0, 8).map(skill => ({
    skill: skill.name.length > 12 ? skill.name.substring(0, 12) + '...' : skill.name,
    fullName: skill.name,
    score: skill.score,
    fullMark: 100,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No skills data available
      </div>
    );
  }

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid 
            stroke="#374151" 
            strokeDasharray="3 3" 
          />
          <PolarAngleAxis 
            dataKey="skill" 
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            className="text-xs"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: '#6B7280', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Skill Score"
            dataKey="score"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              borderColor: '#374151',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
            }}
            formatter={(value: any, name: any, props: any) => [
              `${value}%`,
              props.payload.fullName
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
