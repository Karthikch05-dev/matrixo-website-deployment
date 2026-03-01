// ============================================================
// SkillDNAâ„¢ Dashboard - Main Dashboard Component
// Full-featured skill genome visualization
// ============================================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaDna, FaBrain, FaChartLine, FaRocket, FaEdit,
  FaTrophy, FaFire, FaHistory, FaBullseye, FaLightbulb,
  FaGraduationCap, FaChartBar, FaExclamationTriangle
} from 'react-icons/fa';
import { SkillDNAProfile } from '@/lib/skilldna/types';
import { getScoreGrade, getScoreGradient, getScoreColor } from '@/lib/skilldna/scoring';
import SkillRadarChart from './charts/SkillRadarChart';
import DynamicScoreMeter from './charts/DynamicScoreMeter';
import CareerAlignmentBar from './charts/CareerAlignmentBar';
import SkillGapCards from './SkillGapCards';
import PersonaSummary from './PersonaSummary';
import LearningPathsSection from './LearningPathsSection';
import ProfileEditSection from './ProfileEditSection';

interface SkillDNADashboardProps {
  profile: SkillDNAProfile;
  userName?: string;
  onRefresh?: () => Promise<void>;
  onEditProfile?: () => void;
}

export default function SkillDNADashboard({ 
  profile, 
  userName, 
  onRefresh,
  onEditProfile 
}: SkillDNADashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'gaps' | 'paths' | 'edit'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FaDna },
    { id: 'skills' as const, label: 'Skills', icon: FaChartBar },
    { id: 'gaps' as const, label: 'Skill Gaps', icon: FaExclamationTriangle },
    { id: 'paths' as const, label: 'Learning', icon: FaGraduationCap },
    { id: 'edit' as const, label: 'Edit', icon: FaEdit },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/20 to-indigo-50/20 dark:from-gray-950 dark:via-purple-950/20 dark:to-blue-950/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 px-4 py-1.5 rounded-full mb-3 text-sm">
                <FaDna className="animate-pulse" />
                <span className="font-semibold">SkillDNAâ„¢ Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {userName ? `${userName}'s` : 'Your'} Skill Genome
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Last updated: {new Date(profile.lastUpdated).toLocaleDateString()} Â· 
                Version {profile.version}
              </p>
            </div>

            {/* Dynamic Score Badge */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {profile.dynamicSkillScore}
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  / 1000 Â· {getScoreGrade(profile.dynamicSkillScore, 1000)}
                </p>
              </div>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                  title="Refresh profile"
                >
                  <FaHistory />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-gray-200/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="text-sm" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Cognitive Score', value: profile.cognitiveScore, max: 100, icon: FaBrain, color: 'from-purple-500 to-fuchsia-500' },
                { label: 'Learning Velocity', value: profile.learningVelocity, max: 100, icon: FaRocket, color: 'from-blue-500 to-cyan-500' },
                { label: 'Career Alignment', value: profile.careerAlignmentScore, max: 100, icon: FaBullseye, color: 'from-green-500 to-emerald-500' },
                { label: 'Skill Clusters', value: profile.skillClusters.length, max: undefined, icon: FaFire, color: 'from-orange-500 to-red-500' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                    <stat.icon />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}{stat.max ? <span className="text-sm text-gray-500 font-normal">/{stat.max}</span> : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaChartLine className="text-purple-400" />
                  Skill Radar
                </h3>
                <SkillRadarChart skills={profile.technicalSkills} />
              </div>

              {/* Dynamic Score Meter */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaTrophy className="text-yellow-400" />
                  Dynamic Skill Score
                </h3>
                <DynamicScoreMeter score={profile.dynamicSkillScore} />
              </div>
            </div>

            {/* Career Alignment */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaBullseye className="text-green-400" />
                Career Alignment Progress
              </h3>
              <CareerAlignmentBar
                score={profile.careerAlignmentScore}
                cognitiveScore={profile.cognitiveScore}
                learningVelocity={profile.learningVelocity}
              />
            </div>

            {/* Persona Summary */}
            <PersonaSummary persona={profile.persona} />

            {/* Behavioral Traits */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaLightbulb className="text-amber-400" />
                Behavioral Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.behavioralTraits.map((trait, i) => (
                  <motion.div
                    key={trait.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{trait.name}</span>
                        <span className={`text-sm font-bold ${getScoreColor(trait.score)}`}>{trait.score}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${getScoreGradient(trait.score)} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.score}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{trait.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'skills' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Technical Skills Detail */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Technical Skills Breakdown</h3>
              <div className="space-y-4">
                {profile.technicalSkills.map((skill, i) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{skill.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{skill.category}</span>
                        {skill.trend === 'rising' && <span className="text-green-400 text-xs">â†‘</span>}
                        {skill.trend === 'declining' && <span className="text-red-400 text-xs">â†“</span>}
                      </div>
                      <span className={`text-sm font-bold ${getScoreColor(skill.score)}`}>{skill.score}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${getScoreGradient(skill.score)} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Skill Clusters */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Skill Clusters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.skillClusters.map((cluster, i) => (
                  <motion.div
                    key={cluster.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{cluster.name}</h4>
                      <span className={`text-sm font-bold ${getScoreColor(cluster.strength)}`}>{cluster.strength}%</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{cluster.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cluster.skills.map((skill) => (
                        <span key={skill} className="text-xs px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'gaps' && (
          <SkillGapCards gaps={profile.skillGaps} />
        )}

        {activeTab === 'paths' && (
          <LearningPathsSection paths={profile.learningPaths} />
        )}

        {activeTab === 'edit' && (
          <ProfileEditSection profile={profile} onSave={onEditProfile} />
        )}
      </div>
    </div>
  );
}
