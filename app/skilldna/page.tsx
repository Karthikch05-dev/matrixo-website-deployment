'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSkillDNA } from '@/hooks/useSkillDNA'
import OnboardingFlow from '@/components/skilldna/OnboardingFlow'
import SkillDNADashboard from '@/components/skilldna/SkillDNADashboard'
import AnalyzingScreen from '@/components/skilldna/AnalyzingScreen'
import { OnboardingData } from '@/lib/skilldna/types'
import { motion } from 'framer-motion'
import { FaDna, FaSignInAlt } from 'react-icons/fa'
import Link from 'next/link'

export default function SkillDNAPage() {
  const { user, loading: authLoading } = useAuth()
  const { 
    profile, 
    loading: skillLoading, 
    error,
    onboardingComplete,
    initializeUser,
    submitOnboarding,
    refreshProfile,
  } = useSkillDNA()
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [initialized, setInitialized] = useState(false)

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
    try {
      await submitOnboarding(data)
    } catch (err) {
      console.error('Onboarding failed:', err)
    } finally {
      setIsAnalyzing(false)
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

  // Show dashboard if onboarding is complete and profile exists
  if (onboardingComplete && profile) {
    return (
      <SkillDNADashboard
        profile={profile}
        userName={user.displayName || undefined}
        onRefresh={refreshProfile}
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
