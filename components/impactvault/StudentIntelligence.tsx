'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTrophy, FaTimes, FaDna, FaBrain, FaRocket, FaUser } from 'react-icons/fa';
import { StudentAnalytics } from '@/lib/impactvault/types';

interface Props {
  students: StudentAnalytics[];
  currentUserUid?: string | null;
}

export default function StudentIntelligence({ students, currentUserUid }: Props) {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);

  const filtered = search
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.branch.toLowerCase().includes(search.toLowerCase()) ||
          s.topSkills.some((sk) => sk.toLowerCase().includes(search.toLowerCase()))
      )
    : students;

  const studentsWithDNA = filtered.filter((s) => s.hasSkillDNA);

  // Find current user's rank for quick display
  const currentUserRank = currentUserUid
    ? studentsWithDNA.findIndex((s) => s.uid === currentUserUid) + 1
    : 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name, branch, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-white/[0.03] border border-gray-200/30 dark:border-white/[0.06] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
          />
        </div>
        <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {studentsWithDNA.length} students with SkillDNA profiles • {filtered.length} total
          </span>
          {currentUserRank > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
              <FaUser className="text-xs" />
              Your Rank: #{currentUserRank}
            </span>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Student Leaderboard
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200/30 dark:border-white/[0.06]">
                <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Rank
                </th>
                <th className="text-left py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Student
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  Branch
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Skill Score
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  Hiring Ready
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                  Skills
                </th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {studentsWithDNA.slice(0, 50).map((student, index) => {
                const isCurrentUser = currentUserUid && student.uid === currentUserUid;
                return (
                  <tr
                    key={student.uid}
                    className={`border-b transition-colors ${
                      isCurrentUser
                        ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/30'
                        : 'border-gray-100/50 dark:border-gray-700/30 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                            : index === 2
                            ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                            : 'bg-gradient-to-br from-gray-500 to-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {student.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-normal">
                              (You)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                        {student.branch}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      {student.branch}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {student.dynamicSkillScore}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center hidden md:table-cell">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          student.hiringReadiness >= 70
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : student.hiringReadiness >= 40
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {student.hiringReadiness}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {student.skillCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {studentsWithDNA.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              No students with SkillDNA profiles found
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Students need to complete their SkillDNA assessment to appear on the leaderboard
            </p>
          </div>
        )}

        {studentsWithDNA.length > 50 && (
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing top 50 students • {studentsWithDNA.length - 50} more students in this institution
          </div>
        )}
      </motion.div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Student Profile
                </h3>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedStudent.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedStudent.branch} • Year {selectedStudent.year}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <MetricBox
                    icon={FaTrophy}
                    label="Skill Score"
                    value={`${selectedStudent.dynamicSkillScore}/1000`}
                    color="text-emerald-500"
                  />
                  <MetricBox
                    icon={FaRocket}
                    label="Hiring Ready"
                    value={`${selectedStudent.hiringReadiness}%`}
                    color="text-orange-500"
                  />
                  <MetricBox
                    icon={FaBrain}
                    label="Cognitive"
                    value={`${selectedStudent.cognitiveScore}%`}
                    color="text-purple-500"
                  />
                  <MetricBox
                    icon={FaDna}
                    label="Learning Velocity"
                    value={`${selectedStudent.learningVelocity}%`}
                    color="text-cyan-500"
                  />
                </div>

                {selectedStudent.topSkills.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Top Skills
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.topSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudent.skillClusters.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Skill Clusters
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.skillClusters.map((cluster) => (
                        <span
                          key={cluster}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium"
                        >
                          {cluster}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/50 dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200/30 dark:border-white/[0.06]">
      <Icon className={`${color} text-lg mb-2`} />
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
