'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaChartLine, FaUsers, FaTrophy, FaClock, FaGraduationCap, FaChartBar, FaDownload, FaFilter, FaCalendarAlt, FaArrowUp, FaArrowDown, FaCheckCircle, FaFire } from 'react-icons/fa'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  coursesCompleted: number
  avgCompletionRate: number
  totalLearningHours: number
  avgSkillScore: number
}

interface CourseData {
  id: string
  name: string
  enrolled: number
  completed: number
  avgScore: number
  avgTime: string
  trend: 'up' | 'down'
}

const stats: DashboardStats = {
  totalStudents: 1247,
  activeStudents: 892,
  coursesCompleted: 3456,
  avgCompletionRate: 78.5,
  totalLearningHours: 12840,
  avgSkillScore: 82.3,
}

const courses: CourseData[] = [
  {
    id: '1',
    name: 'Full-Stack Web Development',
    enrolled: 456,
    completed: 342,
    avgScore: 85.2,
    avgTime: '8.2 weeks',
    trend: 'up',
  },
  {
    id: '2',
    name: 'UI/UX Design Fundamentals',
    enrolled: 389,
    completed: 298,
    avgScore: 88.7,
    avgTime: '6.5 weeks',
    trend: 'up',
  },
  {
    id: '3',
    name: 'Data Science & Analytics',
    enrolled: 234,
    completed: 167,
    avgScore: 79.4,
    avgTime: '9.8 weeks',
    trend: 'down',
  },
  {
    id: '4',
    name: 'Mobile App Development',
    enrolled: 168,
    completed: 132,
    avgScore: 83.1,
    avgTime: '7.3 weeks',
    trend: 'up',
  },
]

const skillGaps = [
  { skill: 'Advanced JavaScript', students: 234, severity: 'high' },
  { skill: 'System Design', students: 189, severity: 'high' },
  { skill: 'Cloud Computing', students: 156, severity: 'medium' },
  { skill: 'Database Optimization', students: 142, severity: 'medium' },
  { skill: 'API Development', students: 98, severity: 'low' },
]

const topPerformers = [
  { rank: 1, name: 'Rahul Sharma', xp: 8750, courses: 12, avgScore: 94.5 },
  { rank: 2, name: 'Priya Patel', xp: 8420, courses: 11, avgScore: 93.2 },
  { rank: 3, name: 'Amit Kumar', xp: 8100, courses: 10, avgScore: 91.8 },
  { rank: 4, name: 'Sneha Singh', xp: 7890, courses: 10, avgScore: 90.5 },
  { rank: 5, name: 'Karthik Reddy', xp: 7650, courses: 9, avgScore: 89.7 },
]

export default function ImpactVault() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedView, setSelectedView] = useState<'overview' | 'courses' | 'students' | 'skills'>('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/10 dark:to-emerald-900/10 py-20">
      <div className="container-custom px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full mb-3">
                <FaChartLine className="animate-pulse" />
                <span className="font-bold">ImpactVault™ Analytics</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Institutional Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Real-time insights into student progress and institutional impact
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="flex bg-white/50 dark:bg-white/[0.03] backdrop-blur-md rounded-lg shadow-lg p-1">
                {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      timeRange === range
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg shadow-lg font-medium flex items-center gap-2 hover:shadow-xl"
              >
                <FaDownload /> Export
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl">
                <FaUsers />
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm font-bold">
                <FaArrowUp /> 12%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalStudents.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
            <div className="mt-3 text-xs text-gray-500">
              {stats.activeStudents} active this month
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl">
                <FaCheckCircle />
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm font-bold">
                <FaArrowUp /> 8%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.avgCompletionRate}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Completion Rate</p>
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${stats.avgCompletionRate}%` }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                <FaTrophy />
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm font-bold">
                <FaArrowUp /> 15%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.coursesCompleted.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Courses Completed</p>
            <div className="mt-3 text-xs text-gray-500">
              Across all programs
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xl">
                <FaClock />
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm font-bold">
                <FaArrowUp /> 20%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalLearningHours.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Learning Hours</p>
            <div className="mt-3 text-xs text-gray-500">
              ~10.3 hours per student
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl">
                <FaGraduationCap />
              </div>
              <div className="flex items-center gap-1 text-green-500 text-sm font-bold">
                <FaArrowUp /> 5%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.avgSkillScore}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Skill Score</p>
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${stats.avgSkillScore}%` }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                <FaFire />
              </div>
              <div className="text-sm font-bold">
                Top 10%
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">
              97.5%
            </div>
            <p className="text-sm text-white/90">Student Satisfaction</p>
            <div className="mt-3 text-xs text-white/80">
              Based on 1,240 surveys
            </div>
          </motion.div>
        </div>

        {/* Course Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Performance</h2>
            <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <FaFilter /> Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/30 dark:border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Course Name</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Enrolled</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Completed</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Score</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Avg Time</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Trend</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">{course.name}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-gray-700 dark:text-gray-300">{course.enrolled}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-green-600 dark:text-green-400 font-semibold">{course.completed}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-gray-900 dark:text-white">{course.avgScore}%</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-gray-600 dark:text-gray-400">{course.avgTime}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {course.trend === 'up' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                          <FaArrowUp /> Up
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                          <FaArrowDown /> Down
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottom Grid: Skill Gaps & Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skill Gap Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Skill Gap Analysis</h2>
            <div className="space-y-4">
              {skillGaps.map((gap, index) => (
                <div key={gap.skill} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{gap.skill}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{gap.students} students</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          gap.severity === 'high' ? 'bg-red-500' :
                          gap.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(gap.students / 250) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    gap.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                    gap.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {gap.severity}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Performers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass-card p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Top Performers</h2>
            <div className="space-y-4">
              {topPerformers.map((student) => (
                <div key={student.rank} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    student.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                    student.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                    student.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-blue-500 to-indigo-500'
                  }`}>
                    #{student.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">{student.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {student.courses} courses • {student.avgScore}% avg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{student.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
