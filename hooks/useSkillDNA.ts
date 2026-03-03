// ============================================================
// SkillDNA™ React Hook
// Client-side state management for SkillDNA operations
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebaseConfig';
import {
  SkillDNAProfile,
  SkillDNAUserDocument,
  OnboardingData,
  Assessment,
  ActivityType,
  SkillDNAVersion,
  AIAnalysisResponse,
} from '@/lib/skilldna/types';
import {
  getSkillDNAUser,
  hasCompletedOnboarding,
  createSkillDNAUser,
  saveOnboardingData,
  saveSkillDNAProfile,
  updateSkillDNAProfile,
  getSkillDNAProfile,
  getVersionHistory,
  saveAssessment,
  getAssessmentHistory,
  logActivity,
  getActivityLog,
} from '@/lib/skilldna/firestore-service';

interface UseSkillDNAReturn {
  // State
  userData: SkillDNAUserDocument | null;
  profile: SkillDNAProfile | null;
  loading: boolean;
  error: string | null;
  onboardingComplete: boolean;

  // Onboarding
  initializeUser: () => Promise<void>;
  submitOnboarding: (data: OnboardingData) => Promise<AIAnalysisResponse>;

  // Profile
  refreshProfile: () => Promise<void>;
  triggerUpdate: (trigger: ActivityType, newData?: Record<string, any>) => Promise<void>;

  // Assessments
  submitAssessment: (assessment: Omit<Assessment, 'id' | 'userId'>) => Promise<void>;

  // History
  getHistory: () => Promise<SkillDNAVersion[]>;
}

export function useSkillDNA(): UseSkillDNAReturn {
  const { user } = useAuth();
  const [userData, setUserData] = useState<SkillDNAUserDocument | null>(null);
  const [profile, setProfile] = useState<SkillDNAProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Get Firebase Auth token for API calls
  const getAuthToken = useCallback(async (): Promise<string> => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    return auth.currentUser.getIdToken();
  }, []);

  // Load user data on mount
  const loadUserData = useCallback(async () => {
    if (!user) {
      setUserData(null);
      setProfile(null);
      setOnboardingComplete(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getSkillDNAUser(user.uid);
      
      if (data) {
        setUserData(data);
        setProfile(data.skillDNA || null);
        setOnboardingComplete(data.profile?.onboardingComplete === true);
      } else {
        setUserData(null);
        setProfile(null);
        setOnboardingComplete(false);
      }
    } catch (err: any) {
      console.error('Error loading SkillDNA data:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Initialize user document in Firestore
  const initializeUser = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');

    try {
      setError(null);
      await createSkillDNAUser(
        user.uid,
        user.displayName || 'User',
        user.email || '',
        'student'
      );
      await loadUserData();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user, loadUserData]);

  // Submit onboarding data and get AI analysis
  const submitOnboarding = useCallback(async (data: OnboardingData): Promise<AIAnalysisResponse> => {
    if (!user) throw new Error('Not authenticated');

    try {
      setError(null);
      setLoading(true);

      // Save onboarding data to Firestore
      await saveOnboardingData(user.uid, data);

      // Get auth token
      const token = await getAuthToken();

      // Call AI analysis API
      const response = await fetch('/api/skilldna/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ onboardingData: data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      const analysisData: AIAnalysisResponse = result.data;

      // Build full SkillDNA profile (exclude learningVelocityEstimate from spread)
      const { learningVelocityEstimate, ...profileFields } = analysisData;
      const skillDNAProfile: SkillDNAProfile = {
        ...profileFields,
        learningVelocity: learningVelocityEstimate,
        hiringReadiness: analysisData.hiringReadiness ?? 40,
        confidenceIndex: analysisData.confidenceIndex ?? 50,
        lastUpdated: new Date().toISOString(),
        version: 1,
      };

      // Save profile to Firestore
      await saveSkillDNAProfile(user.uid, skillDNAProfile);

      // Log activity
      await logActivity(user.uid, 'profile_updated', { trigger: 'initial_onboarding' });

      // Refresh local state
      await loadUserData();

      return analysisData;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken, loadUserData]);

  // Refresh profile from Firestore
  const refreshProfile = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  // Trigger profile update (after assessment, skill add, etc.)
  const triggerUpdate = useCallback(async (
    trigger: ActivityType,
    newData: Record<string, any> = {}
  ) => {
    if (!user || !profile) throw new Error('No profile to update');

    try {
      setError(null);
      const token = await getAuthToken();

      const response = await fetch('/api/skilldna/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          currentProfile: profile,
          trigger,
          newData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      const result = await response.json();
      
      // Apply updates to Firestore
      if (result.data?.updatedFields) {
        await updateSkillDNAProfile(user.uid, result.data.updatedFields, trigger);
      }

      // Log activity
      await logActivity(user.uid, trigger, newData);

      // Refresh
      await loadUserData();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user, profile, getAuthToken, loadUserData]);

  // Submit assessment and trigger recalculation
  const submitAssessment = useCallback(async (
    assessment: Omit<Assessment, 'id' | 'userId'>
  ) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const assessmentId = await saveAssessment(user.uid, assessment);
      
      // Trigger profile update
      await triggerUpdate('assessment_completed', {
        assessmentId,
        assessment,
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user, triggerUpdate]);

  // Get version history
  const getHistory = useCallback(async (): Promise<SkillDNAVersion[]> => {
    if (!user) return [];
    return getVersionHistory(user.uid);
  }, [user]);

  return {
    userData,
    profile,
    loading,
    error,
    onboardingComplete,
    initializeUser,
    submitOnboarding,
    refreshProfile,
    triggerUpdate,
    submitAssessment,
    getHistory,
  };
}
