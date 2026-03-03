// ============================================================
// SkillDNA™ Firestore Service
// CRUD operations for SkillDNA data in Firestore
// ============================================================

import { db } from '@/lib/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import {
  SkillDNAProfile,
  SkillDNAUserDocument,
  OnboardingData,
  Assessment,
  ActivityLogEntry,
  SkillDNAVersion,
  ActivityType,
  UserRole,
  AcademicBackground,
  CareerGoal,
  TechnicalSkill,
  SkillLevel,
} from './types';

const SKILLDNA_COLLECTION = 'skillDNA_users';
const VERSIONS_SUBCOLLECTION = 'versions';
const ASSESSMENTS_SUBCOLLECTION = 'assessments';
const ACTIVITY_SUBCOLLECTION = 'activityLog';

// ---- User Document Operations ----

/**
 * Get user's complete SkillDNA document
 */
export async function getSkillDNAUser(userId: string): Promise<SkillDNAUserDocument | null> {
  try {
    const docRef = doc(db, SKILLDNA_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as SkillDNAUserDocument;
    }
    return null;
  } catch (error) {
    console.error('Error fetching SkillDNA user:', error);
    throw error;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const userData = await getSkillDNAUser(userId);
    return userData?.profile?.onboardingComplete === true;
  } catch {
    return false;
  }
}

/**
 * Create initial user profile during onboarding
 */
export async function createSkillDNAUser(
  userId: string,
  name: string,
  email: string,
  role: UserRole = 'student'
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const existing = await getDoc(docRef);
  
  if (existing.exists()) {
    return; // Already exists
  }

  const userData: Partial<SkillDNAUserDocument> = {
    profile: {
      name,
      email,
      education: { degree: '', field: '', institution: '', year: '' },
      interests: [],
      goals: { shortTerm: '', midTerm: '', longTerm: '', dreamRole: '', targetIndustries: [] },
      role,
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
    },
  };

  await setDoc(docRef, userData);
}

/**
 * Save onboarding data and mark as complete
 */
export async function saveOnboardingData(
  userId: string,
  onboardingData: OnboardingData
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  
  await updateDoc(docRef, {
    onboardingData,
    'profile.education': onboardingData.academic,
    'profile.interests': onboardingData.interests,
    'profile.goals': onboardingData.careerGoals,
    'profile.onboardingComplete': true,
    'profile.skillDNAVersion': 1,
  });
}

// ---- SkillDNA Profile Operations ----

/**
 * Save AI-generated SkillDNA profile
 */
export async function saveSkillDNAProfile(
  userId: string,
  profile: SkillDNAProfile
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  
  const profileWithTimestamp = {
    ...profile,
    lastUpdated: new Date().toISOString(),
    version: profile.version || 1,
  };

  await updateDoc(docRef, {
    skillDNA: profileWithTimestamp,
  });

  // Save version snapshot
  await saveVersionSnapshot(userId, profileWithTimestamp, 'Initial AI analysis');
}

/**
 * Update specific fields of SkillDNA profile
 */
export async function updateSkillDNAProfile(
  userId: string,
  updates: Partial<SkillDNAProfile>,
  trigger: string
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const currentDoc = await getDoc(docRef);
  
  if (!currentDoc.exists()) {
    throw new Error('User document not found');
  }

  const currentProfile = currentDoc.data().skillDNA as SkillDNAProfile;
  const newVersion = (currentProfile?.version || 0) + 1;

  const updatedProfile = {
    ...currentProfile,
    ...updates,
    lastUpdated: new Date().toISOString(),
    version: newVersion,
  };

  await updateDoc(docRef, {
    skillDNA: updatedProfile,
  });

  // Save version
  await saveVersionSnapshot(userId, updatedProfile, trigger);
}

/**
 * Get user's SkillDNA profile only
 */
export async function getSkillDNAProfile(userId: string): Promise<SkillDNAProfile | null> {
  try {
    const userData = await getSkillDNAUser(userId);
    return userData?.skillDNA || null;
  } catch {
    return null;
  }
}

// ---- Version History ----

/**
 * Save a version snapshot of the SkillDNA profile
 */
async function saveVersionSnapshot(
  userId: string,
  profile: SkillDNAProfile,
  trigger: string
): Promise<void> {
  try {
    const versionsRef = collection(db, SKILLDNA_COLLECTION, userId, VERSIONS_SUBCOLLECTION);
    
    await addDoc(versionsRef, {
      snapshot: profile,
      timestamp: new Date().toISOString(),
      trigger,
    });
  } catch (error) {
    console.error('Error saving version snapshot:', error);
    // Non-critical, don't throw
  }
}

/**
 * Get version history for a user
 */
export async function getVersionHistory(
  userId: string,
  maxVersions: number = 10
): Promise<SkillDNAVersion[]> {
  try {
    const versionsRef = collection(db, SKILLDNA_COLLECTION, userId, VERSIONS_SUBCOLLECTION);
    const q = query(versionsRef, orderBy('timestamp', 'desc'), limit(maxVersions));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      versionId: doc.id,
      ...doc.data(),
    })) as SkillDNAVersion[];
  } catch (error) {
    console.error('Error fetching version history:', error);
    return [];
  }
}

// ---- Assessment Operations ----

/**
 * Save assessment result
 */
export async function saveAssessment(
  userId: string,
  assessment: Omit<Assessment, 'id' | 'userId'>
): Promise<string> {
  const assessRef = collection(db, SKILLDNA_COLLECTION, userId, ASSESSMENTS_SUBCOLLECTION);
  
  const docRef = await addDoc(assessRef, {
    ...assessment,
    userId,
    completedAt: new Date().toISOString(),
  });

  return docRef.id;
}

/**
 * Get user's assessment history
 */
export async function getAssessmentHistory(
  userId: string,
  maxResults: number = 20
): Promise<Assessment[]> {
  try {
    const assessRef = collection(db, SKILLDNA_COLLECTION, userId, ASSESSMENTS_SUBCOLLECTION);
    const q = query(assessRef, orderBy('completedAt', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Assessment[];
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return [];
  }
}

// ---- Activity Log ----

/**
 * Update user's academic background
 */
export async function updateAcademicBackground(
  userId: string,
  academic: AcademicBackground
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  await updateDoc(docRef, {
    'profile.education': academic,
    'onboardingData.academic': academic,
  });
}

/**
 * Update user's interests
 */
export async function updateInterests(
  userId: string,
  interests: string[]
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  await updateDoc(docRef, {
    'profile.interests': interests,
    'onboardingData.interests': interests,
  });
}

/**
 * Update user's career goals
 */
export async function updateCareerGoals(
  userId: string,
  goals: CareerGoal
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  await updateDoc(docRef, {
    'profile.goals': goals,
    'onboardingData.careerGoals': goals,
  });
}

/**
 * Log user activity
 */
export async function logActivity(
  userId: string,
  type: ActivityType,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const activityRef = collection(db, SKILLDNA_COLLECTION, userId, ACTIVITY_SUBCOLLECTION);
    
    await addDoc(activityRef, {
      userId,
      type,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Non-critical
  }
}

/**
 * Get user's activity log
 */
export async function getActivityLog(
  userId: string,
  maxEntries: number = 50
): Promise<ActivityLogEntry[]> {
  try {
    const activityRef = collection(db, SKILLDNA_COLLECTION, userId, ACTIVITY_SUBCOLLECTION);
    const q = query(activityRef, orderBy('timestamp', 'desc'), limit(maxEntries));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLogEntry[];
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return [];
  }
}

// ---- Skill Array CRUD Operations ----

const MAX_SKILLS = 50;

const LEVEL_SCORE_MAP: Record<SkillLevel | string, number> = {
  beginner: 30,
  intermediate: 55,
  advanced: 75,
  expert: 90,
};

/**
 * Add a skill to the user's profile (append to array).
 * Prevents duplicates (case-insensitive), enforces max cap.
 */
export async function addSkillToProfile(
  userId: string,
  skill: { name: string; level: SkillLevel; category: string }
): Promise<TechnicalSkill[]> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const currentDoc = await getDoc(docRef);

  if (!currentDoc.exists()) throw new Error('User document not found');

  const currentProfile = currentDoc.data().skillDNA as SkillDNAProfile | undefined;
  const currentSkills = currentProfile?.technicalSkills || [];

  // Validate name
  const trimmedName = skill.name.trim();
  if (!trimmedName) throw new Error('Skill name cannot be empty');

  // Duplicate check (case-insensitive)
  if (currentSkills.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error(`"${trimmedName}" is already in your skill list`);
  }

  // Cap check
  if (currentSkills.length >= MAX_SKILLS) {
    throw new Error(`Maximum ${MAX_SKILLS} skills allowed`);
  }

  const newSkill: TechnicalSkill = {
    name: trimmedName,
    score: LEVEL_SCORE_MAP[skill.level] || 55,
    category: skill.category,
    trend: 'rising',
    lastAssessed: new Date().toISOString(),
  };

  const updatedSkills = [...currentSkills, newSkill];
  const newVersion = (currentProfile?.version || 0) + 1;

  await updateDoc(docRef, {
    'skillDNA.technicalSkills': updatedSkills,
    'skillDNA.lastUpdated': new Date().toISOString(),
    'skillDNA.version': newVersion,
  });

  return updatedSkills;
}

/**
 * Remove a skill from the profile by name
 */
export async function removeSkillFromProfile(
  userId: string,
  skillName: string
): Promise<TechnicalSkill[]> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const currentDoc = await getDoc(docRef);

  if (!currentDoc.exists()) throw new Error('User document not found');

  const currentProfile = currentDoc.data().skillDNA as SkillDNAProfile | undefined;
  const currentSkills = currentProfile?.technicalSkills || [];

  const updatedSkills = currentSkills.filter(
    s => s.name.toLowerCase() !== skillName.toLowerCase()
  );

  if (updatedSkills.length === currentSkills.length) {
    throw new Error(`Skill "${skillName}" not found`);
  }

  const newVersion = (currentProfile?.version || 0) + 1;

  await updateDoc(docRef, {
    'skillDNA.technicalSkills': updatedSkills,
    'skillDNA.lastUpdated': new Date().toISOString(),
    'skillDNA.version': newVersion,
  });

  return updatedSkills;
}

/**
 * Update a skill's proficiency level
 */
export async function updateSkillProficiency(
  userId: string,
  skillName: string,
  newLevel: SkillLevel
): Promise<TechnicalSkill[]> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const currentDoc = await getDoc(docRef);

  if (!currentDoc.exists()) throw new Error('User document not found');

  const currentProfile = currentDoc.data().skillDNA as SkillDNAProfile | undefined;
  const currentSkills = currentProfile?.technicalSkills || [];

  let found = false;
  const updatedSkills = currentSkills.map(s => {
    if (s.name.toLowerCase() === skillName.toLowerCase()) {
      found = true;
      return {
        ...s,
        score: LEVEL_SCORE_MAP[newLevel] || s.score,
        trend: (LEVEL_SCORE_MAP[newLevel] || 0) > s.score ? 'rising' as const : 'stable' as const,
        lastAssessed: new Date().toISOString(),
      };
    }
    return s;
  });

  if (!found) throw new Error(`Skill "${skillName}" not found`);

  const newVersion = (currentProfile?.version || 0) + 1;

  await updateDoc(docRef, {
    'skillDNA.technicalSkills': updatedSkills,
    'skillDNA.lastUpdated': new Date().toISOString(),
    'skillDNA.version': newVersion,
  });

  return updatedSkills;
}

/**
 * Edit a skill's name, category, and/or level
 */
export async function editSkill(
  userId: string,
  oldSkillName: string,
  updates: { name?: string; level?: SkillLevel; category?: string }
): Promise<TechnicalSkill[]> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const currentDoc = await getDoc(docRef);

  if (!currentDoc.exists()) throw new Error('User document not found');

  const currentProfile = currentDoc.data().skillDNA as SkillDNAProfile | undefined;
  const currentSkills = currentProfile?.technicalSkills || [];

  const newName = updates.name?.trim();

  // If renaming, check for duplicate
  if (newName && newName.toLowerCase() !== oldSkillName.toLowerCase()) {
    if (currentSkills.some(s => s.name.toLowerCase() === newName.toLowerCase())) {
      throw new Error(`"${newName}" already exists in your skill list`);
    }
  }

  let found = false;
  const updatedSkills = currentSkills.map(s => {
    if (s.name.toLowerCase() === oldSkillName.toLowerCase()) {
      found = true;
      const newScore = updates.level ? (LEVEL_SCORE_MAP[updates.level] || s.score) : s.score;
      return {
        ...s,
        name: newName || s.name,
        category: updates.category || s.category,
        score: newScore,
        trend: newScore > s.score ? 'rising' as const : 'stable' as const,
        lastAssessed: new Date().toISOString(),
      };
    }
    return s;
  });

  if (!found) throw new Error(`Skill "${oldSkillName}" not found`);

  const newVersion = (currentProfile?.version || 0) + 1;

  await updateDoc(docRef, {
    'skillDNA.technicalSkills': updatedSkills,
    'skillDNA.lastUpdated': new Date().toISOString(),
    'skillDNA.version': newVersion,
  });

  return updatedSkills;
}
