'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useSkillDNA } from '@/hooks/useSkillDNA'
import OnboardingFlow from '@/components/skilldna/OnboardingFlow'
import SkillDNADashboard from '@/components/skilldna/SkillDNADashboard'
import AnalyzingScreen from '@/components/skilldna/AnalyzingScreen'
import { OnboardingData } from '@/lib/skilldna/types'
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
