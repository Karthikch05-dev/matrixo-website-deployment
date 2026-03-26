// ============================================================
// SkillDNAâ„¢ Profile Edit Section â€” v2
// Skill CRUD + Goal Alignment Intelligence + Smart Stats
// ============================================================

'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaEdit, FaPlus, FaTimes, FaSpinner, FaTrash, FaInfoCircle,
  FaGraduationCap, FaHeart, FaBullseye, FaSyncAlt, FaCrosshairs,
  FaExclamationTriangle, FaLightbulb, FaChartLine, FaCheck,
  FaShieldAlt, FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';
import {
  SkillDNAProfile, SkillLevel, AcademicBackground, CareerGoal,
  TechnicalSkill, SkillGoalAlignment, GoalAlignmentStats, SkillGapSuggestion,
} from '@/lib/skilldna/types';
import {
  computeAllAlignments,
  computeAlignmentStats,
  detectGoalBasedGaps,
  generatePrioritySuggestions,
} from '@/lib/skilldna/goal-alignment-engine';
import { hasVerificationQuestions } from '@/lib/skilldna/verification/question-bank';
import VerificationTestModal from './VerificationTestModal';

interface ProfileEditSectionProps {
  profile: SkillDNAProfile;
  onSave?: () => void;
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

const SKILL_CATEGORIES = [
  'Programming', 'Web Development', 'Mobile Development', 'Data Science',
  'Machine Learning / AI', 'DevOps', 'Cloud Computing', 'Cybersecurity',
  'Database', 'UI / UX Design', 'Networking', 'Business / Management',
  'Communication', 'Other',
];

const LEVEL_INFO: Record<SkillLevel, { label: string; color: string; description: string }> = {
  beginner:     { label: 'Beginner',     color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     description: 'Just started learning' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', description: 'Can work independently' },
  advanced:     { label: 'Advanced',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', description: 'Deep proficiency' },
  expert:       { label: 'Expert',       color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', description: 'Industry-level mastery' },
};

const INTEREST_SUGGESTIONS = [
  'Artificial Intelligence', 'Web Development', 'Mobile Apps', 'Cloud Computing', 'Cybersecurity',
  'Data Science', 'Machine Learning', 'Blockchain', 'IoT', 'Game Development',
  'DevOps', 'UI/UX Design', 'Competitive Programming', 'Open Source', 'Robotics',
];

const MAX_INTERESTS = 10;

// ---- Helper: alignment color ----
function getAlignmentColor(score: number): string {
  if (score >= 65) return 'text-green-400';
  if (score >= 35) return 'text-yellow-400';
  return 'text-red-400';
}

function getAlignmentBg(score: number): string {
  if (score >= 65) return 'bg-green-500';
  if (score >= 35) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getTagColor(tag: string): string {
  if (tag === 'Core') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (tag === 'Support') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function getSeverityColor(severity: string): string {
  if (severity === 'critical') return 'border-red-500/40 bg-red-500/10';
  if (severity === 'important') return 'border-yellow-500/40 bg-yellow-500/10';
  return 'border-blue-500/40 bg-blue-500/10';
}

function getSeverityBadge(severity: string): { label: string; color: string } {
  if (severity === 'critical') return { label: 'Critical', color: 'bg-red-500/20 text-red-400' };
  if (severity === 'important') return { label: 'Important', color: 'bg-yellow-500/20 text-yellow-400' };
  return { label: 'Nice to Have', color: 'bg-blue-500/20 text-blue-400' };
}

// Score â†’ level label
function scoreToLevel(score: number): SkillLevel {
  if (score >= 85) return 'expert';
  if (score >= 65) return 'advanced';
  if (score >= 40) return 'intermediate';
  return 'beginner';
}

export default function ProfileEditSection({
  profile, onSave, onAddSkill, onRemoveSkill, onEditSkill,
  onUpdateAcademic, onUpdateInterests, onUpdateCareerGoal, onRegeneratePersona,
  currentAcademic, currentInterests, currentCareerGoal,
  userId, authToken, onVerificationComplete,
}: ProfileEditSectionProps) {
  // ---- Add skill state ----
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming');
  const [isSaving, setIsSaving] = useState(false);
  const [removingSkill, setRemovingSkill] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [skillAdded, setSkillAdded] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);

  // ---- Edit skill state ----
  const [editingSkillName, setEditingSkillName] = useState<string | null>(null);
  const [editSkillData, setEditSkillData] = useState<{ name: string; level: SkillLevel; category: string }>({ name: '', level: 'intermediate', category: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // ---- Academic state ----
  const [editingAcademic, setEditingAcademic] = useState(false);
  const [academic, setAcademic] = useState<AcademicBackground>(currentAcademic || { degree: '', field: '', institution: '', year: '' });
  const [savingAcademic, setSavingAcademic] = useState(false);

  // ---- Interests state ----
  const [editingInterests, setEditingInterests] = useState(false);
  const [interests, setInterests] = useState<string[]>(currentInterests || []);
  const [newInterest, setNewInterest] = useState('');
  const [savingInterests, setSavingInterests] = useState(false);

  // ---- Career goal state ----
  const [editingCareer, setEditingCareer] = useState(false);
  const [careerGoal, setCareerGoal] = useState<CareerGoal>(currentCareerGoal || { shortTerm: '', midTerm: '', longTerm: '', dreamRole: '', targetIndustries: [] });
  const [savingCareer, setSavingCareer] = useState(false);

  // ---- Regenerate state ----
  const [isRegenerating, setIsRegenerating] = useState(false);

  // ---- Verification state ----
  const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);

  // ---- Computed: Goal Alignment Intelligence ----
  // Memoize goals to prevent useMemo dependency warnings
  const goals = useMemo(() =>
    currentCareerGoal || { shortTerm: '', midTerm: '', longTerm: '', dreamRole: '', targetIndustries: [] as string[] },
    [currentCareerGoal]
  );
  const hasGoals = !!(goals.shortTerm || goals.midTerm || goals.longTerm || goals.dreamRole);

  const enrichedSkills: TechnicalSkill[] = useMemo(() => {
    if (!hasGoals) return profile.technicalSkills;
    return computeAllAlignments(profile.technicalSkills, goals);
  }, [profile.technicalSkills, goals, hasGoals]);

  const alignmentStats: GoalAlignmentStats | null = useMemo(() => {
    if (!hasGoals || profile.technicalSkills.length === 0) return null;
    return computeAlignmentStats(profile.technicalSkills, goals);
  }, [profile.technicalSkills, goals, hasGoals]);

  const gapSuggestions: SkillGapSuggestion[] = useMemo(() => {
    if (!hasGoals) return [];
    return detectGoalBasedGaps(profile.technicalSkills, goals);
  }, [profile.technicalSkills, goals, hasGoals]);

  const prioritySuggestions: string[] = useMemo(() => {
    if (!hasGoals) return [];
    return generatePrioritySuggestions(profile.technicalSkills, goals);
  }, [profile.technicalSkills, goals, hasGoals]);

  // ---- Handlers ----

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    if (!onAddSkill) {
      setMessage({ type: 'error', text: 'Skill saving is not configured. Please reload.' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    setSkillAdded(false);
    try {
      await onAddSkill({ name: newSkillName.trim(), level: newSkillLevel, category: newSkillCategory });
      setMessage({ type: 'success', text: `"${newSkillName.trim()}" added to your SkillDNA!` });
      setNewSkillName('');
      setSkillAdded(true);
      // Auto-focus input for continuous adding
      setTimeout(() => skillInputRef.current?.focus(), 50);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => { setMessage(null); setSkillAdded(false); }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add skill.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    if (!onRemoveSkill) return;
    setRemovingSkill(skillName);
    try {
      await onRemoveSkill(skillName);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to remove "${skillName}": ${error.message}` });
    } finally {
      setRemovingSkill(null);
    }
  };

  const handleStartEdit = (skill: TechnicalSkill) => {
    setEditingSkillName(skill.name);
    setEditSkillData({ name: skill.name, level: scoreToLevel(skill.score), category: skill.category });
  };

  const handleSaveEdit = async () => {
    if (!onEditSkill || !editingSkillName) return;
    setSavingEdit(true);
    try {
      await onEditSkill(editingSkillName, {
        name: editSkillData.name.trim() || editingSkillName,
        level: editSkillData.level,
        category: editSkillData.category,
      });
      setEditingSkillName(null);
      setMessage({ type: 'success', text: 'Skill updated successfully.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update skill.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveAcademic = async () => {
    if (!onUpdateAcademic) return;
    setSavingAcademic(true);
    try {
      await onUpdateAcademic(academic);
      setEditingAcademic(false);
      setMessage({ type: 'success', text: 'Academic background updated.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update academic background.' });
    } finally {
      setSavingAcademic(false);
    }
  };

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (!trimmed) return;
    if (interests.length >= MAX_INTERESTS) {
      setMessage({ type: 'error', text: `Maximum ${MAX_INTERESTS} interests allowed.` });
      return;
    }
    if (interests.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setMessage({ type: 'error', text: `"${trimmed}" is already in your interests.` });
      return;
    }
    setInterests([...interests, trimmed]);
    setNewInterest('');
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleSaveInterests = async () => {
    if (!onUpdateInterests) return;
    setSavingInterests(true);
    try {
      await onUpdateInterests(interests);
      setEditingInterests(false);
      setMessage({ type: 'success', text: 'Interests updated.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update interests.' });
    } finally {
      setSavingInterests(false);
    }
  };

  const handleSaveCareer = async () => {
    if (!onUpdateCareerGoal) return;
    setSavingCareer(true);
    try {
      await onUpdateCareerGoal(careerGoal);
      setEditingCareer(false);
      setMessage({ type: 'success', text: 'Career goals updated.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update career goals.' });
    } finally {
      setSavingCareer(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegeneratePersona) return;
    setIsRegenerating(true);
    try {
      await onRegeneratePersona();
      setMessage({ type: 'success', text: 'AI persona regenerated! Check the Overview tab.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to regenerate persona.' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const selectedLevelInfo = LEVEL_INFO[newSkillLevel];

  // ---- Render ----

  return (
    <div className="space-y-6">

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <FaInfoCircle className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-300">
          Manage your SkillDNA&trade; profile below. You can edit your academic background, interests, career goals,
          add or remove skills, and regenerate your AI persona summary.
        </p>
      </div>

      {/* Global Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'error' && <FaTimes className="flex-shrink-0" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100">
              <FaTimes size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Academic Background ===== */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaGraduationCap className="text-blue-400" /> Academic Background
          </h3>
          {onUpdateAcademic && (
            <button
              onClick={() => { setEditingAcademic(!editingAcademic); setAcademic(currentAcademic || { degree: '', field: '', institution: '', year: '' }); }}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <FaEdit size={12} /> {editingAcademic ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>
        {editingAcademic ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Degree</label>
                <select value={academic.degree} onChange={(e) => setAcademic({ ...academic, degree: e.target.value })} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all">
                  <option value="">Select degree</option>
                  {['B.Tech', 'B.E.', 'B.Sc', 'BCA', 'M.Tech', 'M.Sc', 'MCA', 'MBA', 'PhD', 'Diploma', 'Self-taught', 'Other'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Field of Study</label>
                <input type="text" value={academic.field} onChange={(e) => setAcademic({ ...academic, field: e.target.value })} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all" placeholder="e.g., Computer Science" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Institution</label>
                <input type="text" value={academic.institution} onChange={(e) => setAcademic({ ...academic, institution: e.target.value })} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all" placeholder="College / University name" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Year</label>
                <select value={academic.year} onChange={(e) => setAcademic({ ...academic, year: e.target.value })} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all">
                  <option value="">Select year</option>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'Post-Graduate', 'Working Professional'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleSaveAcademic} disabled={savingAcademic} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 text-sm font-medium">
              {savingAcademic ? <FaSpinner className="animate-spin" /> : null}
              {savingAcademic ? 'Saving...' : 'Save Academic Info'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Degree:</span> <span className="text-gray-900 dark:text-white ml-1">{currentAcademic?.degree || '\u2014'}</span></div>
            <div><span className="text-gray-500">Field:</span> <span className="text-gray-900 dark:text-white ml-1">{currentAcademic?.field || '\u2014'}</span></div>
            <div><span className="text-gray-500">Institution:</span> <span className="text-gray-900 dark:text-white ml-1">{currentAcademic?.institution || '\u2014'}</span></div>
            <div><span className="text-gray-500">Year:</span> <span className="text-gray-900 dark:text-white ml-1">{currentAcademic?.year || '\u2014'}</span></div>
          </div>
        )}
      </div>

      {/* ===== Interests ===== */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaHeart className="text-pink-400" /> Interests
            <span className="text-sm font-normal text-gray-500">({interests.length}/{MAX_INTERESTS})</span>
          </h3>
          {onUpdateInterests && (
            <button onClick={() => { setEditingInterests(!editingInterests); setInterests(currentInterests || []); }} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              <FaEdit size={12} /> {editingInterests ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>
        {editingInterests ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span key={interest} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                  {interest}
                  <button onClick={() => handleRemoveInterest(interest)} className="ml-1 hover:text-red-500"><FaTimes size={10} /></button>
                </span>
              ))}
              {interests.length === 0 && <p className="text-gray-500 text-sm">No interests added yet.</p>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); } }} className="flex-1 p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 transition-all" placeholder="Add a custom interest..." disabled={interests.length >= MAX_INTERESTS} />
              <button onClick={handleAddInterest} disabled={interests.length >= MAX_INTERESTS || !newInterest.trim()} className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all"><FaPlus /></button>
            </div>
            {interests.length < MAX_INTERESTS && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_SUGGESTIONS.filter(s => !interests.some(i => i.toLowerCase() === s.toLowerCase())).slice(0, 8).map((suggestion) => (
                    <button key={suggestion} onClick={() => { if (interests.length < MAX_INTERESTS) setInterests([...interests, suggestion]); }} className="text-xs px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-600 hover:text-white transition-all">
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleSaveInterests} disabled={savingInterests} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 text-sm font-medium">
              {savingInterests ? <FaSpinner className="animate-spin" /> : null}
              {savingInterests ? 'Saving...' : 'Save Interests'}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(currentInterests || []).length > 0 ? (currentInterests || []).map((interest) => (
              <span key={interest} className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{interest}</span>
            )) : <p className="text-gray-500 text-sm">No interests set.</p>}
          </div>
        )}
      </div>

      {/* ===== Career Goals ===== */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaBullseye className="text-green-400" /> Career Goals
          </h3>
          {onUpdateCareerGoal && (
            <button onClick={() => { setEditingCareer(!editingCareer); setCareerGoal(currentCareerGoal || { shortTerm: '', midTerm: '', longTerm: '', dreamRole: '', targetIndustries: [] }); }} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              <FaEdit size={12} /> {editingCareer ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>
        {editingCareer ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Dream Role</label>
              <input type="text" value={careerGoal.dreamRole} onChange={(e) => setCareerGoal({ ...careerGoal, dreamRole: e.target.value })} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all" placeholder="e.g., Senior Software Engineer" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Short-term (1 year)</label>
                <textarea value={careerGoal.shortTerm} onChange={(e) => setCareerGoal({ ...careerGoal, shortTerm: e.target.value })} rows={2} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all resize-none" placeholder="Next year goals" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mid-term (2-3 years)</label>
                <textarea value={careerGoal.midTerm} onChange={(e) => setCareerGoal({ ...careerGoal, midTerm: e.target.value })} rows={2} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all resize-none" placeholder="2-3 year plan" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Long-term (5+ years)</label>
                <textarea value={careerGoal.longTerm} onChange={(e) => setCareerGoal({ ...careerGoal, longTerm: e.target.value })} rows={2} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all resize-none" placeholder="Career vision" />
              </div>
            </div>
            <button onClick={handleSaveCareer} disabled={savingCareer} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 text-sm font-medium">
              {savingCareer ? <FaSpinner className="animate-spin" /> : null}
              {savingCareer ? 'Saving...' : 'Save Career Goals'}
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Dream Role:</span> <span className="text-gray-900 dark:text-white ml-1">{currentCareerGoal?.dreamRole || '\u2014'}</span></div>
            <div><span className="text-gray-500">Short-term:</span> <span className="text-gray-900 dark:text-white ml-1">{currentCareerGoal?.shortTerm || '\u2014'}</span></div>
            <div><span className="text-gray-500">Mid-term:</span> <span className="text-gray-900 dark:text-white ml-1">{currentCareerGoal?.midTerm || '\u2014'}</span></div>
            <div><span className="text-gray-500">Long-term:</span> <span className="text-gray-900 dark:text-white ml-1">{currentCareerGoal?.longTerm || '\u2014'}</span></div>
          </div>
        )}
      </div>

      {/* ===== Regenerate AI Persona ===== */}
      {onRegeneratePersona && (
        <div className="bg-gradient-to-br from-purple-100/40 via-white to-blue-100/40 dark:from-purple-900/20 dark:via-gray-900 dark:to-blue-900/20 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <FaSyncAlt className="text-purple-400" /> Regenerate AI Persona
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            After updating your academic details, interests, or career goals, regenerate your AI persona to reflect the latest changes.
          </p>
          <button onClick={handleRegenerate} disabled={isRegenerating} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all flex items-center gap-2 font-medium">
            {isRegenerating ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
            {isRegenerating ? 'Regenerating...' : 'Regenerate Persona'}
          </button>
        </div>
      )}

      {/* ===== Add New Skill ===== */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <FaEdit className="text-blue-400" /> Add a Skill You Learned
        </h3>
        <p className="text-sm text-gray-400 mb-5">
          Whether from YouTube, a bootcamp, a certification, or self-study &mdash; add it here.
        </p>
        <div className="space-y-3">
          <input
            ref={skillInputRef}
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (!isSaving && newSkillName.trim()) handleAddSkill();
              }
            }}
            placeholder="e.g., Docker, Figma, TensorFlow, Excel..."
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all">
                {SKILL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Proficiency Level</label>
              <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)} className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white focus:border-purple-500 transition-all">
                {(Object.keys(LEVEL_INFO) as SkillLevel[]).map((lvl) => (
                  <option key={lvl} value={lvl}>{LEVEL_INFO[lvl].label} &mdash; {LEVEL_INFO[lvl].description}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full border ${selectedLevelInfo.color} font-medium`}>{selectedLevelInfo.label}</span>
            <span className="text-xs text-gray-500 flex-1">{selectedLevelInfo.description}</span>
            <button onClick={handleAddSkill} disabled={isSaving || !newSkillName.trim()} className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium">
              {isSaving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              {isSaving ? 'Saving...' : 'Add Skill'}
            </button>
          </div>
          {/* Inline success toast */}
          <AnimatePresence>
            {skillAdded && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium"
              >
                <FaCheckCircle className="flex-shrink-0" />
                Skill Added &mdash; keep going!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== Your Skills with Goal Alignment ===== */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaCrosshairs className="text-purple-400" />
          Your Skills
          <span className="ml-1 text-sm font-normal text-gray-500">({enrichedSkills.length} tracked)</span>
        </h3>

        {enrichedSkills.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No skills added yet. Add your first skill above!</p>
        ) : (
          <div className="space-y-4">
            {enrichedSkills.map((skill) => {
              const isEditing = editingSkillName === skill.name;
              const alignment = skill.goalAlignment;
              const vf = skill.verification;
              const canVerify = !!userId && !!authToken && hasVerificationQuestions(skill.name);
              const isOnCooldown = vf?.cooldownUntil ? new Date(vf.cooldownUntil) > new Date() : false;

              return (
                <motion.div
                  key={skill.name}
                  layout
                  className="rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 overflow-hidden group"
                >
                  {/* Skill header row */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-gray-900 dark:text-white font-medium text-sm truncate">{skill.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex-shrink-0">{skill.category}</span>
                      {alignment && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${getTagColor(alignment.strategicTag)}`}>
                          {alignment.strategicTag}
                        </span>
                      )}

                      {/* Verification badge */}
                      {vf?.status === 'verified' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium flex-shrink-0" title={`Verified — ${vf.bestScore}%`}>
                          <FaCheckCircle size={9} /> Verified
                        </span>
                      )}
                      {vf?.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium flex-shrink-0" title={`Failed — ${vf.verificationScore}%`}>
                          <FaTimesCircle size={9} /> Failed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-20 h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${skill.score}%` }} />
                      </div>
                      <span className="text-sm text-gray-500 w-10 text-right">{skill.score}%</span>
                      {skill.trend === 'rising' && <span className="text-green-400 text-xs">{'\u2191'}</span>}
                      {skill.trend === 'declining' && <span className="text-red-400 text-xs">{'\u2193'}</span>}
                      {skill.trend === 'stable' && <span className="text-gray-500 text-xs">{'\u2192'}</span>}
                      {onEditSkill && (
                        <button onClick={() => handleStartEdit(skill)} className="opacity-0 group-hover:opacity-100 p-1 text-blue-400 hover:text-blue-300 transition-all" title="Edit skill">
                          <FaEdit size={12} />
                        </button>
                      )}
                      {onRemoveSkill && (
                        <button onClick={() => handleRemoveSkill(skill.name)} disabled={removingSkill === skill.name} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all disabled:opacity-50" title={`Remove ${skill.name}`}>
                          {removingSkill === skill.name ? <FaSpinner size={12} className="animate-spin" /> : <FaTrash size={12} />}
                        </button>
                      )}
                      {canVerify && (
                        <button
                          onClick={() => setVerifyingSkill(skill.name)}
                          disabled={isOnCooldown}
                          className={`opacity-0 group-hover:opacity-100 p-1 transition-all disabled:opacity-40 ${
                            vf?.status === 'verified'
                              ? 'text-green-400 hover:text-green-300'
                              : 'text-purple-400 hover:text-purple-300'
                          }`}
                          title={
                            isOnCooldown
                              ? 'Cooldown — try again later'
                              : vf?.status === 'verified'
                              ? 'Retake verification'
                              : vf?.status === 'failed'
                              ? 'Retry verification'
                              : 'Take verification test'
                          }
                        >
                          <FaShieldAlt size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-gray-300/30 dark:border-gray-700/30 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Skill Name</label>
                              <input type="text" value={editSkillData.name} onChange={(e) => setEditSkillData({ ...editSkillData, name: e.target.value })} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white text-sm focus:border-purple-500 transition-all" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Category</label>
                              <select value={editSkillData.category} onChange={(e) => setEditSkillData({ ...editSkillData, category: e.target.value })} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white text-sm focus:border-purple-500 transition-all">
                                {SKILL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Level</label>
                              <select value={editSkillData.level} onChange={(e) => setEditSkillData({ ...editSkillData, level: e.target.value as SkillLevel })} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white text-sm focus:border-purple-500 transition-all">
                                {(Object.keys(LEVEL_INFO) as SkillLevel[]).map((lvl) => (
                                  <option key={lvl} value={lvl}>{LEVEL_INFO[lvl].label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} disabled={savingEdit} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5">
                              {savingEdit ? <FaSpinner size={10} className="animate-spin" /> : <FaCheck size={10} />}
                              {savingEdit ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setEditingSkillName(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Goal Alignment bar (shown when goals exist) */}
                  {alignment && !isEditing && (
                    <div className="px-4 pb-3 pt-1">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">Goal Alignment</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] text-gray-500">Short-Term</span>
                            <span className={`text-[10px] font-bold ${getAlignmentColor(alignment.shortTermRelevance)}`}>{alignment.shortTermRelevance}%</span>
                          </div>
                          <div className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getAlignmentBg(alignment.shortTermRelevance)}`} style={{ width: `${alignment.shortTermRelevance}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] text-gray-500">Mid-Term</span>
                            <span className={`text-[10px] font-bold ${getAlignmentColor(alignment.midTermRelevance)}`}>{alignment.midTermRelevance}%</span>
                          </div>
                          <div className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getAlignmentBg(alignment.midTermRelevance)}`} style={{ width: `${alignment.midTermRelevance}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] text-gray-500">Long-Term</span>
                            <span className={`text-[10px] font-bold ${getAlignmentColor(alignment.longTermRelevance)}`}>{alignment.longTermRelevance}%</span>
                          </div>
                          <div className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getAlignmentBg(alignment.longTermRelevance)}`} style={{ width: `${alignment.longTermRelevance}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Intelligent Gap Detection ===== */}
      {gapSuggestions.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <FaExclamationTriangle className="text-amber-400" /> Skill Gap Detector
          </h3>
          <p className="text-sm text-gray-400 mb-4">Based on your career goals, these skills need attention.</p>
          <div className="space-y-3">
            {gapSuggestions.map((gap, i) => {
              const badge = getSeverityBadge(gap.severity);
              return (
                <motion.div
                  key={gap.skill + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border ${getSeverityColor(gap.severity)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{gap.skill}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1.5">{gap.reason}</p>
                      <div className="flex items-center gap-1.5 text-xs text-purple-400">
                        <FaLightbulb size={10} />
                        <span>{gap.priorityAction}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Priority Suggestions ===== */}
      {prioritySuggestions.length > 0 && (
        <div className="bg-gradient-to-br from-purple-100/30 via-white to-blue-100/30 dark:from-purple-900/10 dark:via-gray-900 dark:to-blue-900/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FaLightbulb className="text-purple-400" /> Priority Actions
          </h3>
          <ul className="space-y-2">
            {prioritySuggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">{'\u2022'}</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== Intelligent Profile Statistics ===== */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaChartLine className="text-blue-400" /> Profile Intelligence
        </h3>

        {alignmentStats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-purple-400">{alignmentStats.totalSkills}</p>
              <p className="text-xs text-gray-500">Total Skills</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-green-400">{alignmentStats.coreSkills}</p>
              <p className="text-xs text-gray-500">Core Skills</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-blue-400">{alignmentStats.skillGoalMatchPercent}%</p>
              <p className="text-xs text-gray-500">Skill-Goal Match</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-amber-400">{alignmentStats.shortTermExecution}%</p>
              <p className="text-xs text-gray-500">Short-Term Ready</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-cyan-400">{alignmentStats.longTermReadiness}%</p>
              <p className="text-xs text-gray-500">Long-Term Ready</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-purple-400">{profile.technicalSkills.length}</p>
              <p className="text-xs text-gray-500">Skills Tracked</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-blue-400">{profile.skillClusters.length}</p>
              <p className="text-xs text-gray-500">Skill Clusters</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-amber-400">{profile.skillGaps.length}</p>
              <p className="text-xs text-gray-500">Gaps Identified</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-2xl font-bold text-green-400">{profile.version}</p>
              <p className="text-xs text-gray-500">Profile Version</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== Verification Test Modal ===== */}
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
