// ============================================================
// SkillDNA™ Profile Edit Section
// User can add/remove skills they learned outside the platform
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaPlus, FaTimes, FaSpinner, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { SkillDNAProfile, SkillLevel } from '@/lib/skilldna/types';

interface ProfileEditSectionProps {
  profile: SkillDNAProfile;
  onSave?: () => void;
  onAddSkill?: (skill: { name: string; level: SkillLevel; category: string }) => Promise<void>;
  onRemoveSkill?: (skillName: string) => Promise<void>;
}

const SKILL_CATEGORIES = [
  'Programming',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning / AI',
  'DevOps',
  'Cloud Computing',
  'Cybersecurity',
  'Database',
  'UI / UX Design',
  'Networking',
  'Business / Management',
  'Communication',
  'Other',
]

const LEVEL_INFO: Record<SkillLevel, { label: string; color: string; description: string }> = {
  beginner:     { label: 'Beginner',     color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     description: 'Just started learning' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', description: 'Can work independently' },
  advanced:     { label: 'Advanced',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', description: 'Deep proficiency' },
  expert:       { label: 'Expert',       color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', description: 'Industry-level mastery' },
}

export default function ProfileEditSection({ profile, onSave, onAddSkill, onRemoveSkill }: ProfileEditSectionProps) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming');
  const [isSaving, setIsSaving] = useState(false);
  const [removingSkill, setRemovingSkill] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    if (!onAddSkill) {
      setMessage({ type: 'error', text: 'Skill saving is not configured yet. Please reload the page.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await onAddSkill({ name: newSkillName.trim(), level: newSkillLevel, category: newSkillCategory });
      setMessage({ type: 'success', text: `"${newSkillName.trim()}" added! Your SkillDNA profile has been updated.` });
      setNewSkillName('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add skill. Please try again.' });
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

  const selectedLevelInfo = LEVEL_INFO[newSkillLevel];

  return (
    <div className="space-y-6">

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <FaInfoCircle className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-300">
          Learned something outside matriXO? Add it here and your SkillDNA™ profile will be updated instantly.
          Skills you add manually are marked as <span className="text-green-400 font-medium">rising</span> to reflect your active learning.
        </p>
      </div>

      {/* Add New Skill */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <FaEdit className="text-blue-400" />
          Add a Skill You Learned
        </h3>
        <p className="text-sm text-gray-400 mb-5">
          Whether from YouTube, a bootcamp, a certification, or self-study — add it here.
        </p>

        <div className="space-y-3">
          {/* Skill name */}
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isSaving && newSkillName.trim() && handleAddSkill()}
            placeholder="e.g., Docker, Figma, TensorFlow, Excel..."
            className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 transition-all"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Proficiency Level</label>
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-500 transition-all"
              >
                {(Object.keys(LEVEL_INFO) as SkillLevel[]).map((lvl) => (
                  <option key={lvl} value={lvl}>{LEVEL_INFO[lvl].label} — {LEVEL_INFO[lvl].description}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Level preview badge + Add button */}
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full border ${selectedLevelInfo.color} font-medium`}>
              {selectedLevelInfo.label}
            </span>
            <span className="text-xs text-gray-500 flex-1">{selectedLevelInfo.description}</span>
            <button
              onClick={handleAddSkill}
              disabled={isSaving || !newSkillName.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
            >
              {isSaving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              {isSaving ? 'Saving...' : 'Add Skill'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
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
      </div>

      {/* Current Skills List */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Your Skills
          <span className="ml-2 text-sm font-normal text-gray-500">({profile.technicalSkills.length} tracked)</span>
        </h3>
        {profile.technicalSkills.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No skills added yet. Add your first skill above!</p>
        ) : (
          <div className="space-y-2">
            {profile.technicalSkills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-gray-900 dark:text-white font-medium text-sm truncate">{skill.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {skill.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20 h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">{skill.score}%</span>
                  {skill.trend === 'rising'   && <span className="text-green-400 text-xs">↑</span>}
                  {skill.trend === 'declining' && <span className="text-red-400 text-xs">↓</span>}
                  {skill.trend === 'stable'    && <span className="text-gray-500 text-xs">→</span>}
                  {onRemoveSkill && (
                    <button
                      onClick={() => handleRemoveSkill(skill.name)}
                      disabled={removingSkill === skill.name}
                      className="opacity-0 group-hover:opacity-100 ml-1 p-1 text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                      title={`Remove ${skill.name}`}
                    >
                      {removingSkill === skill.name ? <FaSpinner size={12} className="animate-spin" /> : <FaTrash size={12} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Statistics */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Statistics</h3>
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
      </div>
    </div>
  );
}