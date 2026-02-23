// ============================================================
// SkillDNA™ Profile Edit Section
// User can update their profile information
// ============================================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaPlus, FaTimes, FaSave, FaSpinner } from 'react-icons/fa';
import { SkillDNAProfile, SkillLevel } from '@/lib/skilldna/types';

interface ProfileEditSectionProps {
  profile: SkillDNAProfile;
  onSave?: () => void;
}

export default function ProfileEditSection({ profile, onSave }: ProfileEditSectionProps) {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('beginner');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // In a full implementation, this would call the API to add the skill
      // and trigger a profile recalculation
      setMessage({ type: 'success', text: `Skill "${newSkillName}" would be added. Full save requires backend integration.` });
      setNewSkillName('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add skill' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Skill */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaEdit className="text-blue-400" />
          Add New Skills
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Add new skills to trigger an AI-powered profile recalculation
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill name (e.g., Docker)"
            className="flex-1 p-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
            className="p-3 rounded-xl border border-gray-700 bg-gray-800 text-white focus:border-purple-500 transition-all"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="p-3 rounded-xl border border-gray-700 bg-gray-800 text-white focus:border-purple-500 transition-all"
          >
            <option value="Programming">Programming</option>
            <option value="Web Development">Web Development</option>
            <option value="Data Science">Data Science</option>
            <option value="DevOps">DevOps</option>
            <option value="Cloud Computing">Cloud Computing</option>
            <option value="Other">Other</option>
          </select>
          <button
            onClick={handleAddSkill}
            disabled={isSaving || !newSkillName.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
          >
            {isSaving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            Add
          </button>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-xl text-sm ${
              message.type === 'success' 
                ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </div>

      {/* Current Skills List */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Current Skills</h3>
        <div className="space-y-2">
          {profile.technicalSkills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-white font-medium text-sm">{skill.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                  {skill.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-10 text-right">{skill.score}%</span>
                {skill.trend === 'rising' && <span className="text-green-400 text-xs">↑</span>}
                {skill.trend === 'declining' && <span className="text-red-400 text-xs">↓</span>}
                {skill.trend === 'stable' && <span className="text-gray-500 text-xs">→</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Profile Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-gray-800/50">
            <p className="text-2xl font-bold text-purple-400">{profile.technicalSkills.length}</p>
            <p className="text-xs text-gray-500">Skills Tracked</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50">
            <p className="text-2xl font-bold text-blue-400">{profile.skillClusters.length}</p>
            <p className="text-xs text-gray-500">Skill Clusters</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50">
            <p className="text-2xl font-bold text-amber-400">{profile.skillGaps.length}</p>
            <p className="text-xs text-gray-500">Gaps Identified</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50">
            <p className="text-2xl font-bold text-green-400">{profile.version}</p>
            <p className="text-xs text-gray-500">Profile Version</p>
          </div>
        </div>
      </div>
    </div>
  );
}
