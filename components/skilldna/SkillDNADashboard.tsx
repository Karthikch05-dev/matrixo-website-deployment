// ============================================================
// SkillDNA Dashboard - Main Dashboard Component
// Full-featured skill genome visualization
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FaDna, FaBrain, FaChartLine, FaRocket, FaEdit,
  FaTrophy, FaFire, FaHistory, FaBullseye, FaLightbulb,
  FaGraduationCap, FaChartBar, FaExclamationTriangle,
  FaShieldAlt, FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';
import { SkillDNAProfile, SkillLevel, AcademicBackground, CareerGoal } from '@/lib/skilldna/types';
import { getScoreGrade, getScoreGradient, getScoreColor } from '@/lib/skilldna/scoring';
import { hasVerificationQuestions } from '@/lib/skilldna/verification/question-bank';
import { calculateRealisticScores, SCORE_EXPLANATIONS } from '@/lib/skilldna/services/score-calculation-engine';
import { analyzeGoalIntelligence } from '@/lib/skilldna/services/goal-intelligence-engine';
import { getVerificationMultiplier } from '@/lib/skilldna/verification/scoring-engine';
import SkillRadarChart from './charts/SkillRadarChart';
import DynamicScoreMeter from './charts/DynamicScoreMeter';
import CareerAlignmentBar from './charts/CareerAlignmentBar';
import SkillGapCards from './SkillGapCards';
import PersonaSummary from './PersonaSummary';
import LearningPathsSection from './LearningPathsSection';
import ProfileEditSection from './ProfileEditSection';
import VerificationTestModal from './VerificationTestModal';
import ScoreTooltip from './ScoreTooltip';
import GoalAlignmentSection from './GoalAlignmentSection';

interface SkillDNADashboardProps {
  profile: SkillDNAProfile;
  userName?: string;
  onRefresh?: () => Promise<void>;
  onEditProfile?: () => void;
  onAddSkill?: (skill: { name: string; level: SkillLevel; category: string }) => Promise<void>;
  onRemoveSkill?: (skillName: string) => Promise<void>;
  onEditSkill?: (oldName: string, updates: { name?: string; level?: SkillLevel; category?: string }) => Promise<void>;
  onUpdateAcademic?: (academic: AcademicBackground) => Promise<void>;
  onUpdateInterests?: (interests: string[]) => Promise<void>;
  onUpdateCareerGoal?: (goal: CareerGoal) => Promise<void>;
  onRegeneratePersona?: () => Promise<void>;
  currentAcademic?: AcademicBackground;
  currentInterests?: string[];
  currentCareerGoal?: CareerGoal;
  // Verification props
  userId?: string;
  authToken?: string;
  onVerificationComplete?: () => void;
}

export default function SkillDNADashboard({ 
  profile, 
  userName, 
  onRefresh,
  onEditProfile,
  onAddSkill,
  onRemoveSkill,
  onEditSkill,
  onUpdateAcademic,
  onUpdateInterests,
  onUpdateCareerGoal,
  onRegeneratePersona,
  currentAcademic,
  currentInterests,
  currentCareerGoal,
  userId,
  authToken,
  onVerificationComplete,
}: SkillDNADashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'gaps' | 'paths' | 'edit'>('overview');
  const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);

  // Compute realistic scores and goal intelligence
  const realisticScores = useMemo(
    () => calculateRealisticScores(profile, currentCareerGoal),
    [profile, currentCareerGoal]
  );

  const goalIntelligence = useMemo(() => {
    if (currentCareerGoal && currentCareerGoal.shortTerm) {
      return analyzeGoalIntelligence(profile.technicalSkills, currentCareerGoal);
    }
    return null;
  }, [profile.technicalSkills, currentCareerGoal]);

  // ---- Verification analytics ----
  const verificationStats = useMemo(() => {
    const skills = profile.technicalSkills;
    const total = skills.length;
    const verified = skills.filter((s) => s.verification?.status === 'verified').length;
    const failed = skills.filter((s) => s.verification?.status === 'failed').length;
    const unverified = total - verified - failed;
    const pct = total > 0 ? Math.round((verified / total) * 100) : 0;

    // Effective contribution: sum of (score * multiplier) vs sum of scores
    let rawTotal = 0;
    let effectiveTotal = 0;
    for (const s of skills) {
      rawTotal += s.score;
      effectiveTotal += s.score * getVerificationMultiplier(s.verification as any);
    }
    const avgEffective = total > 0 ? Math.round(effectiveTotal / total) : 0;
    const avgRaw = total > 0 ? Math.round(rawTotal / total) : 0;

    return { total, verified, failed, unverified, pct, avgEffective, avgRaw };
  }, [profile.technicalSkills]);

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
                <span className="font-semibold">SkillDNA&trade; Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {userName ? `${userName}'s` : 'Your'} Skill Genome
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Last updated: {new Date(profile.lastUpdated).toLocaleDateString()} &middot; 
                Version {profile.version}
              </p>
            </div>

            {/* Dynamic Score Badge */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {realisticScores.dynamicSkillScore}
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  / 1000 &middot; {getScoreGrade(realisticScores.dynamicSkillScore, 1000)}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Cognitive Score', value: realisticScores.cognitiveScore, max: 100, icon: FaBrain, color: 'from-purple-500 to-fuchsia-500' },
                { label: 'Learning Velocity', value: realisticScores.learningVelocity, max: 100, icon: FaRocket, color: 'from-blue-500 to-cyan-500' },
                { label: 'Career Alignment', value: realisticScores.careerAlignmentScore, max: 100, icon: FaBullseye, color: 'from-green-500 to-emerald-500' },
                { label: 'Hiring Readiness', value: realisticScores.hiringReadiness, max: 100, icon: FaTrophy, color: 'from-amber-500 to-orange-500' },
                { label: 'Confidence Index', value: realisticScores.confidenceIndex, max: 100, icon: FaLightbulb, color: 'from-cyan-500 to-teal-500' },
                { label: 'Skill Clusters', value: profile.skillClusters.length, max: undefined, icon: FaFire, color: 'from-orange-500 to-red-500' },
              ].map((stat, i) => {
                const explanation = SCORE_EXPLANATIONS[stat.label];
                return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                      <stat.icon />
                    </div>
                    {explanation && (
                      <ScoreTooltip data={explanation} />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}{stat.max ? <span className="text-sm text-gray-500 font-normal">/{stat.max}</span> : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </motion.div>
                );
              })}
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
                <DynamicScoreMeter score={realisticScores.dynamicSkillScore} />
              </div>
            </div>

            {/* Career Alignment */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaBullseye className="text-green-400" />
                Career Alignment Progress
              </h3>
              <CareerAlignmentBar
                score={realisticScores.careerAlignmentScore}
                cognitiveScore={realisticScores.cognitiveScore}
                learningVelocity={realisticScores.learningVelocity}
              />
            </div>

            {/* Verification Analytics */}
            {profile.technicalSkills.length > 0 && (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-purple-400" />
                  Verification Analytics
                  <span className="text-sm font-normal text-gray-500 ml-auto">
                    {verificationStats.verified}/{verificationStats.total} verified
                  </span>
                </h3>

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <p className="text-2xl font-bold text-green-400">{verificationStats.verified}</p>
                    <p className="text-[10px] text-green-500/80 font-medium uppercase tracking-wider">Verified</p>
                    <p className="text-[10px] text-gray-500">100% weight</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-500/5 border border-gray-500/20">
                    <p className="text-2xl font-bold text-gray-400">{verificationStats.unverified}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Unverified</p>
                    <p className="text-[10px] text-gray-500">40% weight</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <p className="text-2xl font-bold text-red-400">{verificationStats.failed}</p>
                    <p className="text-[10px] text-red-500/80 font-medium uppercase tracking-wider">Failed</p>
                    <p className="text-[10px] text-gray-500">20% weight</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <p className="text-2xl font-bold text-purple-400">{verificationStats.pct}%</p>
                    <p className="text-[10px] text-purple-400 font-medium uppercase tracking-wider">Verified Rate</p>
                    <p className="text-[10px] text-gray-500">{verificationStats.verified}/{verificationStats.total}</p>
                  </div>
                </div>

                {/* Effective vs Raw score */}
                <div className="bg-gray-100/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Effective Skill Average</span>
                    <span className="text-sm font-bold text-purple-400">{verificationStats.avgEffective}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                      style={{ width: `${verificationStats.avgEffective}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Raw average: {verificationStats.avgRaw}%</span>
                    <span className="text-xs text-gray-500">
                      {verificationStats.avgEffective < verificationStats.avgRaw
                        ? `\u2212${verificationStats.avgRaw - verificationStats.avgEffective}% from unverified penalty`
                        : 'Fully verified \u2014 no penalty'}
                    </span>
                  </div>
                  {verificationStats.unverified > 0 && (
                    <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1.5">
                      <FaExclamationTriangle size={10} />
                      Verify {verificationStats.unverified} more skill{verificationStats.unverified > 1 ? 's' : ''} to unlock full score potential
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Goal Alignment Intelligence */}
            {goalIntelligence && (
              <GoalAlignmentSection intelligence={goalIntelligence} />
            )}

            {/* Persona Summary */}
            <PersonaSummary persona={profile.persona} />

            {/* Skills Overview with Verification Status */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaChartBar className="text-purple-400" />
                Your Skills
                <span className="text-sm font-normal text-gray-500">({profile.technicalSkills.length})</span>
              </h3>
              {profile.technicalSkills.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No skills added yet. Go to the Edit tab to add skills.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profile.technicalSkills.map((skill, i) => {
                    const vf = skill.verification;
                    const isVerified = vf?.status === 'verified';
                    const isFailed = vf?.status === 'failed';
                    return (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isVerified
                            ? 'bg-green-500/5 border-green-500/30'
                            : isFailed
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-300/50 dark:border-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{skill.name}</span>
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold flex-shrink-0">
                              <FaCheckCircle size={9} /> Verified
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex-shrink-0">
                              <FaTimesCircle size={9} /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/20 font-medium flex-shrink-0">
                              <FaShieldAlt size={8} /> Unverified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(skill.score)}`}
                              style={{ width: `${skill.score}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${getScoreColor(skill.score)} w-8 text-right`}>{skill.score}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-gray-500">{skill.category}</span>
                          {isVerified && vf && (
                            <span className="text-[10px] text-green-500">Best: {vf.bestScore}%</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

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
                {profile.technicalSkills.map((skill, i) => {
                  const vf = skill.verification;
                  const canVerify = !!userId && !!authToken && hasVerificationQuestions(skill.name);
                  const isOnCooldown = vf?.cooldownUntil ? new Date(vf.cooldownUntil) > new Date() : false;
                  const mult = getVerificationMultiplier(vf as any);
                  const effectiveScore = Math.round(skill.score * mult);

                  return (
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
                        {skill.trend === 'rising' && <span className="text-green-400 text-xs">{"\u2191"}</span>}
                        {skill.trend === 'declining' && <span className="text-red-400 text-xs">{"\u2193"}</span>}

                        {/* Verification badge */}
                        {vf?.status === 'verified' && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium" title={`Verified \u2014 ${vf.bestScore}%`}>
                            <FaCheckCircle size={9} /> Verified
                          </span>
                        )}
                        {vf?.status === 'failed' && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium" title={`Failed \u2014 ${vf.verificationScore}%`}>
                            <FaTimesCircle size={9} /> Failed
                          </span>
                        )}
                        {!vf && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20 font-medium" title="Unverified — 40% weight">
                            <FaShieldAlt size={8} /> 40%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {canVerify && (
                          <button
                            onClick={() => setVerifyingSkill(skill.name)}
                            disabled={isOnCooldown}
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all flex items-center gap-1 disabled:opacity-40 ${
                              vf?.status === 'verified'
                                ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                                : vf?.status === 'failed'
                                ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                            }`}
                            title={
                              isOnCooldown
                                ? 'Cooldown \u2014 try again later'
                                : vf?.status === 'verified'
                                ? 'Retake verification'
                                : vf?.status === 'failed'
                                ? 'Retry verification'
                                : 'Take verification test'
                            }
                          >
                            <FaShieldAlt size={10} />
                            {vf?.status === 'verified' ? 'Retake' : vf?.status === 'failed' ? 'Retry' : 'Verify'}
                          </button>
                        )}
                        <span className={`text-sm font-bold ${getScoreColor(skill.score)}`}>{skill.score}%</span>
                        {mult < 1 && (
                          <span className="text-[10px] text-gray-500" title={`Effective score: ${effectiveScore}% (${Math.round(mult * 100)}% weight)`}>
                            → {effectiveScore}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative">
                      {/* Effective score bar (dimmer) */}
                      {mult < 1 && (
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-gray-600/40 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.score}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                        />
                      )}
                      <motion.div
                        className={`h-full bg-gradient-to-r ${getScoreGradient(skill.score)} rounded-full relative z-10`}
                        initial={{ width: 0 }}
                        animate={{ width: `${mult < 1 ? effectiveScore : skill.score}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </motion.div>
                  );
                })}
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
          <ProfileEditSection
            profile={profile}
            onSave={onEditProfile}
            onAddSkill={onAddSkill}
            onRemoveSkill={onRemoveSkill}
            onEditSkill={onEditSkill}
            onUpdateAcademic={onUpdateAcademic}
            onUpdateInterests={onUpdateInterests}
            onUpdateCareerGoal={onUpdateCareerGoal}
            onRegeneratePersona={onRegeneratePersona}
            currentAcademic={currentAcademic}
            currentInterests={currentInterests}
            currentCareerGoal={currentCareerGoal}
            userId={userId}
            authToken={authToken}
            onVerificationComplete={onVerificationComplete}
          />
        )}
      </div>

      {/* Verification Test Modal (from Skills tab) */}
      {verifyingSkill && userId && authToken && (
        <VerificationTestModal
          skillName={verifyingSkill}
          userId={userId}
          authToken={authToken}
          onClose={() => setVerifyingSkill(null)}
          onVerified={() => {
            setVerifyingSkill(null);
            if (onVerificationComplete) onVerificationComplete();
          }}
        />
      )}
    </div>
  );
}
