// ============================================================
// SkillDNA™ Onboarding Flow
// Multi-step onboarding wizard with animated transitions
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBrain, FaRocket, FaCode, FaGraduationCap, FaHeart, 
  FaBullseye, FaStar, FaFileUpload, FaUser, FaDna,
  FaArrowLeft, FaArrowRight, FaCheck, FaSpinner
} from 'react-icons/fa';
import {
  OnboardingData,
  AcademicBackground,
  SkillEntry,
  CareerGoal,
  SelfRating,
  PersonalityAnswers,
  SkillLevel,
} from '@/lib/skilldna/types';

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  userName?: string;
}

type Step = 'welcome' | 'past' | 'academic' | 'skills' | 'interests' | 'career' | 'rating' | 'personality' | 'review';

const STEPS: Step[] = ['welcome', 'past', 'academic', 'skills', 'interests', 'career', 'rating', 'personality', 'review'];

const SKILL_CATEGORIES = [
  'Programming', 'Web Development', 'Mobile Development', 'Data Science',
  'Machine Learning', 'DevOps', 'Cloud Computing', 'Cybersecurity',
  'UI/UX Design', 'Database', 'Blockchain', 'IoT', 'Game Development',
  'Embedded Systems', 'Networking', 'Other'
];

const INTEREST_OPTIONS = [
  'Artificial Intelligence', 'Web Development', 'Mobile Apps', 'Data Science',
  'Cloud Computing', 'Cybersecurity', 'Blockchain', 'IoT',
  'Game Development', 'DevOps', 'UI/UX Design', 'Machine Learning',
  'Robotics', 'AR/VR', 'Quantum Computing', 'Open Source',
  'Competitive Programming', 'Research', 'Startups', 'Product Management'
];

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance/Fintech', 'Healthcare', 'E-commerce',
  'Education/EdTech', 'Gaming', 'Automotive', 'Aerospace',
  'Consulting', 'Media/Entertainment', 'Government', 'Startup'
];

export default function OnboardingFlow({ onComplete, userName }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [pastExperience, setPastExperience] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [futureAspiration, setFutureAspiration] = useState('');

  const [academic, setAcademic] = useState<AcademicBackground>({
    degree: '', field: '', institution: '', year: '', gpa: '', achievements: []
  });

  const [skills, setSkills] = useState<SkillEntry[]>([
    { name: '', level: 'beginner', yearsOfExperience: 0, category: 'Programming' }
  ]);

  const [interests, setInterests] = useState<string[]>([]);

  const [careerGoals, setCareerGoals] = useState<CareerGoal>({
    shortTerm: '', midTerm: '', longTerm: '', dreamRole: '', targetIndustries: []
  });

  const [selfRating, setSelfRating] = useState<SelfRating>({
    problemSolving: 5, communication: 5, leadership: 5, creativity: 5,
    teamwork: 5, adaptability: 5, technicalDepth: 5, learningSpeed: 5
  });

  const [personality, setPersonality] = useState<PersonalityAnswers>({
    workStyle: '', stressResponse: '', decisionMaking: '',
    motivationDriver: '', learningPreference: '', challengeApproach: ''
  });

  const [newAchievement, setNewAchievement] = useState('');

  // Navigation
  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1]);
  }, [currentStep]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1]);
  }, [currentStep]);

  // Skill management
  const addSkill = () => {
    setSkills([...skills, { name: '', level: 'beginner', yearsOfExperience: 0, category: 'Programming' }]);
  };

  const removeSkill = (index: number) => {
    if (skills.length > 1) {
      setSkills(skills.filter((_, i) => i !== index));
    }
  };

  const updateSkill = (index: number, field: keyof SkillEntry, value: any) => {
    const updated = [...skills];
    (updated[index] as any)[field] = value;
    setSkills(updated);
  };

  // Interest toggle
  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 10 ? [...prev, interest] : prev
    );
  };

  // Industry toggle
  const toggleIndustry = (industry: string) => {
    setCareerGoals(prev => ({
      ...prev,
      targetIndustries: prev.targetIndustries.includes(industry)
        ? prev.targetIndustries.filter(i => i !== industry)
        : prev.targetIndustries.length < 5 ? [...prev.targetIndustries, industry] : prev.targetIndustries
    }));
  };

  // Achievement management
  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAcademic(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setAcademic(prev => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index)
    }));
  };

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const data: OnboardingData = {
        academic,
        skills: skills.filter(s => s.name.trim()),
        interests,
        careerGoals,
        selfRating,
        personality,
        pastExperience,
        currentSituation,
        futureAspiration,
      };

      await onComplete(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  // Rating slider component
  const RatingSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Novice</span>
        <span>Expert</span>
      </div>
    </div>
  );

  // Personality option component
  const PersonalityOption = ({
    question,
    options,
    value,
    onChange,
  }: {
    question: string;
    options: { value: string; label: string; emoji: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{question}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
              value === opt.value
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'border-gray-200/30 dark:border-white/[0.06] hover:border-purple-300 text-gray-600 dark:text-gray-400'
            }`}
          >
            <span className="mr-1">{opt.emoji}</span> {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  // Step content renderer
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <FaDna className="text-4xl text-white animate-pulse" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome{userName ? `, ${userName}` : ''}!
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              Let's map your unique <span className="text-purple-600 font-semibold">SkillDNA™</span>. 
              This will take about 5-7 minutes and our AI will create your personalized skill genome.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {[
                { icon: FaBrain, label: 'AI Analysis', desc: 'Powered by advanced AI' },
                { icon: FaDna, label: 'Skill Genome', desc: 'Your unique DNA map' },
                { icon: FaRocket, label: 'Growth Paths', desc: 'Personalized roadmap' },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <item.icon className="text-2xl text-purple-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'past':
        return (
          <motion.div key="past" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                <FaUser />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Journey</h3>
                <p className="text-sm text-gray-500">Past, present, and future</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🔙 What have you done so far? (Past experience)
                </label>
                <textarea
                  value={pastExperience}
                  onChange={(e) => setPastExperience(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  rows={3}
                  placeholder="E.g., Built a weather app in React, participated in a hackathon, completed CS50..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📍 What are you currently doing? (Present)
                </label>
                <textarea
                  value={currentSituation}
                  onChange={(e) => setCurrentSituation(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  rows={3}
                  placeholder="E.g., 3rd year CSE student learning full-stack development, interning at..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🚀 What do you want to become? (Future aspiration)
                </label>
                <textarea
                  value={futureAspiration}
                  onChange={(e) => setFutureAspiration(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  rows={3}
                  placeholder="E.g., Senior Software Engineer at a top tech company, or launch my own startup..."
                />
              </div>
            </div>
          </motion.div>
        );

      case 'academic':
        return (
          <motion.div key="academic" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                <FaGraduationCap />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Academic Background</h3>
                <p className="text-sm text-gray-500">Your educational foundation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree</label>
                <select
                  value={academic.degree}
                  onChange={(e) => setAcademic({ ...academic, degree: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                >
                  <option value="">Select degree</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.E.">B.E.</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="BCA">BCA</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="MCA">MCA</option>
                  <option value="MBA">MBA</option>
                  <option value="PhD">PhD</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Self-taught">Self-taught</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Field of Study</label>
                <input
                  type="text"
                  value={academic.field}
                  onChange={(e) => setAcademic({ ...academic, field: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution</label>
                <input
                  type="text"
                  value={academic.institution}
                  onChange={(e) => setAcademic({ ...academic, institution: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="College / University name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <select
                  value={academic.year}
                  onChange={(e) => setAcademic({ ...academic, year: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                >
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post-Graduate">Post-Graduate</option>
                  <option value="Working Professional">Working Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GPA / Percentage (optional)</label>
                <input
                  type="text"
                  value={academic.gpa || ''}
                  onChange={(e) => setAcademic({ ...academic, gpa: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="e.g., 8.5 or 85%"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Achievements</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAchievement(); } }}
                  className="flex-1 p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="Add an achievement"
                />
                <button type="button" onClick={addAchievement} className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex-shrink-0">+</button>
              </div>
              {(academic.achievements || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(academic.achievements || []).map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                      {a}
                      <button type="button" onClick={() => removeAchievement(i)} className="ml-1 hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'skills':
        return (
          <motion.div key="skills" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                <FaCode />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Skills</h3>
                <p className="text-sm text-gray-500">What do you know?</p>
              </div>
            </div>

            <div className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index} className="p-4 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-gray-50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Skill Name</label>
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all text-sm"
                        placeholder="e.g., Python"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(index, 'level', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all text-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                      <select
                        value={skill.category}
                        onChange={(e) => updateSkill(index, 'category', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all text-sm"
                      >
                        {SKILL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Years</label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={skill.yearsOfExperience}
                          onChange={(e) => updateSkill(index, 'yearsOfExperience', parseInt(e.target.value) || 0)}
                          className="w-full p-2.5 rounded-lg border border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all text-sm"
                        />
                      </div>
                      {skills.length > 1 && (
                        <button
                          onClick={() => removeSkill(index)}
                          className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addSkill}
                className="w-full p-3 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium text-sm"
              >
                + Add Another Skill
              </button>
            </div>
          </motion.div>
        );

      case 'interests':
        return (
          <motion.div key="interests" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white">
                <FaHeart />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Interests</h3>
                <p className="text-sm text-gray-500">Select up to 10 areas that excite you</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                    interests.includes(interest)
                      ? 'border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30'
                      : 'border-gray-200/30 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:border-purple-300'
                  }`}
                >
                  {interests.includes(interest) && <FaCheck className="inline mr-1 text-xs" />}
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">{interests.length}/10 selected</p>
          </motion.div>
        );

      case 'career':
        return (
          <motion.div key="career" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                <FaBullseye />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Career Goals</h3>
                <p className="text-sm text-gray-500">Where are you heading?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dream Role</label>
                <input
                  type="text"
                  value={careerGoals.dreamRole}
                  onChange={(e) => setCareerGoals({ ...careerGoals, dreamRole: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="e.g., Senior Software Engineer at Google"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short-term Goal (Next 1 year)</label>
                <input
                  type="text"
                  value={careerGoals.shortTerm}
                  onChange={(e) => setCareerGoals({ ...careerGoals, shortTerm: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="What do you want to achieve in the next year?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mid-term Goal (2-3 years)</label>
                <input
                  type="text"
                  value={careerGoals.midTerm}
                  onChange={(e) => setCareerGoals({ ...careerGoals, midTerm: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="Where do you see yourself in 2-3 years?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Long-term Vision (5+ years)</label>
                <input
                  type="text"
                  value={careerGoals.longTerm}
                  onChange={(e) => setCareerGoals({ ...careerGoals, longTerm: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200/30 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-white focus:border-purple-500 transition-all"
                  placeholder="Your ultimate career vision"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Industries (select up to 5)</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => toggleIndustry(industry)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                        careerGoals.targetIndustries.includes(industry)
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200/30 dark:border-white/[0.06] text-gray-600 dark:text-gray-400 hover:border-purple-300'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'rating':
        return (
          <motion.div key="rating" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white">
                <FaStar />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Self Assessment</h3>
                <p className="text-sm text-gray-500">Rate yourself honestly (1 = Novice, 10 = Expert)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <RatingSlider label="Problem Solving" value={selfRating.problemSolving} onChange={(v) => setSelfRating({ ...selfRating, problemSolving: v })} />
              <RatingSlider label="Communication" value={selfRating.communication} onChange={(v) => setSelfRating({ ...selfRating, communication: v })} />
              <RatingSlider label="Leadership" value={selfRating.leadership} onChange={(v) => setSelfRating({ ...selfRating, leadership: v })} />
              <RatingSlider label="Creativity" value={selfRating.creativity} onChange={(v) => setSelfRating({ ...selfRating, creativity: v })} />
              <RatingSlider label="Teamwork" value={selfRating.teamwork} onChange={(v) => setSelfRating({ ...selfRating, teamwork: v })} />
              <RatingSlider label="Adaptability" value={selfRating.adaptability} onChange={(v) => setSelfRating({ ...selfRating, adaptability: v })} />
              <RatingSlider label="Technical Depth" value={selfRating.technicalDepth} onChange={(v) => setSelfRating({ ...selfRating, technicalDepth: v })} />
              <RatingSlider label="Learning Speed" value={selfRating.learningSpeed} onChange={(v) => setSelfRating({ ...selfRating, learningSpeed: v })} />
            </div>
          </motion.div>
        );

      case 'personality':
        return (
          <motion.div key="personality" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                <FaBrain />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personality Profile</h3>
                <p className="text-sm text-gray-500">Help us understand how you work best</p>
              </div>
            </div>

            <PersonalityOption
              question="How do you prefer to work?"
              options={[
                { value: 'solo', label: 'Solo Focus', emoji: '🧘' },
                { value: 'team', label: 'Team Player', emoji: '👥' },
                { value: 'hybrid', label: 'Hybrid', emoji: '🔄' },
              ]}
              value={personality.workStyle}
              onChange={(v) => setPersonality({ ...personality, workStyle: v })}
            />

            <PersonalityOption
              question="How do you handle stress and pressure?"
              options={[
                { value: 'thrive', label: 'I thrive under pressure', emoji: '🔥' },
                { value: 'manage', label: 'I manage it well', emoji: '⚖️' },
                { value: 'avoid', label: 'I prefer calm', emoji: '🧘' },
              ]}
              value={personality.stressResponse}
              onChange={(v) => setPersonality({ ...personality, stressResponse: v })}
            />

            <PersonalityOption
              question="How do you make decisions?"
              options={[
                { value: 'analytical', label: 'Data-driven', emoji: '📊' },
                { value: 'intuitive', label: 'Gut feeling', emoji: '💡' },
                { value: 'collaborative', label: 'Team input', emoji: '🤝' },
              ]}
              value={personality.decisionMaking}
              onChange={(v) => setPersonality({ ...personality, decisionMaking: v })}
            />

            <PersonalityOption
              question="What drives you most?"
              options={[
                { value: 'impact', label: 'Making impact', emoji: '🌍' },
                { value: 'mastery', label: 'Mastery', emoji: '🏆' },
                { value: 'autonomy', label: 'Freedom', emoji: '🦅' },
                { value: 'recognition', label: 'Recognition', emoji: '⭐' },
              ]}
              value={personality.motivationDriver}
              onChange={(v) => setPersonality({ ...personality, motivationDriver: v })}
            />

            <PersonalityOption
              question="How do you prefer to learn?"
              options={[
                { value: 'visual', label: 'Videos/Diagrams', emoji: '🎬' },
                { value: 'hands-on', label: 'Hands-on Projects', emoji: '🛠️' },
                { value: 'reading', label: 'Reading/Docs', emoji: '📚' },
                { value: 'discussion', label: 'Discussion', emoji: '💬' },
              ]}
              value={personality.learningPreference}
              onChange={(v) => setPersonality({ ...personality, learningPreference: v })}
            />

            <PersonalityOption
              question="How do you approach challenges?"
              options={[
                { value: 'head-on', label: 'Head-on', emoji: '⚡' },
                { value: 'systematic', label: 'Systematic', emoji: '📋' },
                { value: 'creative', label: 'Creative', emoji: '🎨' },
                { value: 'delegate', label: 'Delegate', emoji: '🤲' },
              ]}
              value={personality.challengeApproach}
              onChange={(v) => setPersonality({ ...personality, challengeApproach: v })}
            />
          </motion.div>
        );

      case 'review':
        return (
          <motion.div key="review" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white">
                <FaCheck />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review & Submit</h3>
                <p className="text-sm text-gray-500">Everything looks good?</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Academic</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{academic.degree} in {academic.field}</p>
                  <p className="text-xs text-gray-500">{academic.institution} · {academic.year}</p>
                </div>

                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Skills</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{skills.filter(s => s.name).length} skills added</p>
                  <p className="text-xs text-gray-500">{skills.filter(s => s.name).map(s => s.name).join(', ')}</p>
                </div>

                <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
                  <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mb-1">Interests</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{interests.length} interests</p>
                  <p className="text-xs text-gray-500">{interests.slice(0, 5).join(', ')}{interests.length > 5 ? '...' : ''}</p>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Dream Role</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{careerGoals.dreamRole || 'Not set'}</p>
                  <p className="text-xs text-gray-500">{careerGoals.targetIndustries.join(', ')}</p>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-purple-200 dark:hover:shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    AI is analyzing your SkillDNA...
                  </>
                ) : (
                  <>
                    <FaDna />
                    Generate My SkillDNA™
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/30 to-blue-950/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-400">
              Step {currentIndex + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-purple-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-200 dark:border-gray-800">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={goBack}
            disabled={currentStep === 'welcome'}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaArrowLeft /> Back
          </button>

          {currentStep !== 'review' && (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all font-medium"
            >
              Next <FaArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
