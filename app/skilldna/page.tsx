'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSkillDNA } from '@/hooks/useSkillDNA'
import OnboardingFlow from '@/components/skilldna/OnboardingFlow'
import SkillDNADashboard from '@/components/skilldna/SkillDNADashboard'
import AnalyzingScreen from '@/components/skilldna/AnalyzingScreen'
import { OnboardingData, SkillLevel, TechnicalSkill, AcademicBackground, CareerGoal } from '@/lib/skilldna/types'
import { updateSkillDNAProfile, updateAcademicBackground, updateInterests, updateCareerGoals, editSkill } from '@/lib/skilldna/firestore-service'
import { motion } from 'framer-motion'
import { FaDna, FaSignInAlt, FaExclamationTriangle, FaRedo } from 'react-icons/fa'
import Link from 'next/link'

export default function SkillDNAPage() {
  const { user, loading: authLoading } = useAuth()
  const { 
    profile, 
    loading: skillLoading, 
    error,
    userData,
    onboardingComplete,
    initializeUser,
    submitOnboarding,
    refreshProfile,
  } = useSkillDNA()
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const pendingDataRef = useRef<OnboardingData | null>(null)

  // Score mapping for skill levels
  const levelScoreMap: Record<SkillLevel, number> = {
    beginner: 30,
    intermediate: 55,
    advanced: 75,
    expert: 90,
  }

  // Add a skill manually -> save directly to Firestore, then refresh
  const handleAddSkill = async (skill: { name: string; level: SkillLevel; category: string }) => {
    if (!user || !profile) throw new Error('Not authenticated')

    const trimmedName = skill.name.trim()
    // Prevent duplicates (case-insensitive)
    const alreadyExists = profile.technicalSkills.some(
      (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (alreadyExists) throw new Error(`"${trimmedName}" is already in your skill list`)

    const newSkill: TechnicalSkill = {
      name: trimmedName,
      score: levelScoreMap[skill.level],
      category: skill.category,
      trend: 'rising',
      lastAssessed: new Date().toISOString(),
    }

    const updatedSkills = [...profile.technicalSkills, newSkill]
    await updateSkillDNAProfile(user.uid, { technicalSkills: updatedSkills }, 'skill_added')
    await refreshProfile()
  }

  // Remove a skill -> update Firestore, then refresh
  const handleRemoveSkill = async (skillName: string) => {
    if (!user || !profile) throw new Error('Not authenticated')
    const updatedSkills = profile.technicalSkills.filter(
      (s) => s.name.toLowerCase() !== skillName.toLowerCase()
    )
    await updateSkillDNAProfile(user.uid, { technicalSkills: updatedSkills }, 'skill_added')
    await refreshProfile()
  }

  // Update academic background
  const handleUpdateAcademic = async (academic: AcademicBackground) => {
    if (!user) throw new Error('Not authenticated')
    await updateAcademicBackground(user.uid, academic)
    await refreshProfile()
  }

  // Update interests
  const handleUpdateInterests = async (interests: string[]) => {
    if (!user) throw new Error('Not authenticated')
    await updateInterests(user.uid, interests)
    await refreshProfile()
  }

  // Update career goals
  const handleUpdateCareerGoal = async (goal: CareerGoal) => {
    if (!user) throw new Error('Not authenticated')
    await updateCareerGoals(user.uid, goal)
    await refreshProfile()
  }

  // Regenerate AI persona by re-submitting saved onboarding data
  // Preserves manually-managed skills so they are not overwritten by AI output
  const handleRegeneratePersona = async () => {
    if (!user || !userData?.onboardingData) throw new Error('No onboarding data found')

    // Snapshot current skills before regeneration overwrites the profile
    const preservedSkills = profile ? [...profile.technicalSkills] : []

    setIsAnalyzing(true)
    try {
      await submitOnboarding(userData.onboardingData)

      // Restore the user's actual skills after AI regeneration
      if (preservedSkills.length > 0) {
        await updateSkillDNAProfile(user.uid, { technicalSkills: preservedSkills }, 'skills_restored')
        await refreshProfile()
      }
    } catch (err: any) {
      console.error('Regeneration failed:', err)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Edit a skill (rename, change level/category)
  const handleEditSkill = async (oldName: string, updates: { name?: string; level?: SkillLevel; category?: string }) => {
    if (!user) throw new Error('Not authenticated')
    await editSkill(user.uid, oldName, updates)
    await refreshProfile()
  }

  // Initialize user document when authenticated
  useEffect(() => {
    if (user && !initialized) {
      initializeUser()
        .then(() => setInitialized(true))
        .catch(console.error)
    }
  }, [user, initialized, initializeUser])

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: OnboardingData) => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    pendingDataRef.current = data
    try {
      await submitOnboarding(data)
    } catch (err: any) {
      console.error('Onboarding failed:', err)
      setAnalysisError(err.message || 'AI analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Retry analysis with saved onboarding data
  const handleRetry = async () => {
    if (pendingDataRef.current) {
      await handleOnboardingComplete(pendingDataRef.current)
    }
  }

  // Loading state
  if (authLoading || skillLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <FaDna className="text-5xl text-purple-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading SkillDNA™...</p>
        </motion.div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <FaDna className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">SkillDNA™</h1>
          <p className="text-gray-400 mb-6">
            Sign in to discover your unique skill genome. Our AI will analyze your profile 
            and create a personalized growth roadmap.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full hover:shadow-xl hover:shadow-purple-500/30 transition-all"
          >
            <FaSignInAlt />
            Sign In to Start
          </Link>
        </motion.div>
      </div>
    )
  }

  // AI is analyzing
  if (isAnalyzing) {
    return <AnalyzingScreen />
  }

  // Analysis failed - show error with retry
  if (analysisError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <FaExclamationTriangle className="text-3xl text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Analysis Failed</h1>
          <p className="text-gray-400 mb-2">
            Your answers have been saved but the AI analysis couldn&apos;t complete.
          </p>
          <p className="text-red-400/80 text-sm mb-6 bg-red-500/10 px-4 py-2 rounded-lg inline-block">
            {analysisError}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full hover:shadow-xl hover:shadow-purple-500/30 transition-all"
            >
              <FaRedo />
              Retry Analysis
            </button>
            <button
              onClick={() => { setAnalysisError(null); pendingDataRef.current = null }}
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Start Over
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Onboarding saved but profile missing (recovery from previous failed attempt)
  if (onboardingComplete && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <FaDna className="text-3xl text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Almost There!</h1>
          <p className="text-gray-400 mb-6">
            Your onboarding data is saved but the AI analysis hasn&apos;t completed yet. 
            Click below to generate your SkillDNA profile.
          </p>
          <button
            onClick={async () => {
              const savedData = userData?.onboardingData
              if (savedData) {
                await handleOnboardingComplete(savedData)
              } else {
                setAnalysisError('No onboarding data found. Please start over.')
              }
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full hover:shadow-xl hover:shadow-purple-500/30 transition-all"
          >
            <FaRedo />
            Generate SkillDNA™
          </button>
        </motion.div>
      </div>
    )
  }

  // Show dashboard if onboarding is complete and profile exists
  if (onboardingComplete && profile) {
    return (
      <SkillDNADashboard
        profile={profile}
        userName={user.displayName || undefined}
        onRefresh={refreshProfile}
        onAddSkill={handleAddSkill}
        onRemoveSkill={handleRemoveSkill}
        onEditSkill={handleEditSkill}
        onUpdateAcademic={handleUpdateAcademic}
        onUpdateInterests={handleUpdateInterests}
        onUpdateCareerGoal={handleUpdateCareerGoal}
        onRegeneratePersona={handleRegeneratePersona}
        currentAcademic={userData?.profile?.education}
        currentInterests={userData?.profile?.interests}
        currentCareerGoal={userData?.profile?.goals}
      />
    )
  }

  // Show onboarding flow
  return (
    <OnboardingFlow
      onComplete={handleOnboardingComplete}
      userName={user.displayName || undefined}
    />
  )
}
