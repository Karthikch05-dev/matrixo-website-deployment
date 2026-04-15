// ============================================================
// ImpactVault™ Firestore Service
// Data access layer for institutional analytics
// ============================================================

import { db } from '@/lib/firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  documentId,
} from 'firebase/firestore';
import { UserProfile } from '@/lib/ProfileContext';
import { SkillDNAUserDocument, SkillDNAProfile } from '@/lib/skilldna/types';
import { ImpactVaultAccess, ImpactVaultRole, StudentWithSkillDNA } from './types';

const IMPACTVAULT_ACCESS_COLLECTION = 'impactvault_access';
const USER_PROFILES_COLLECTION = 'UserProfiles';
const SKILLDNA_COLLECTION = 'skillDNA_users';

// ---- RBAC Operations ----

/**
 * Get user's ImpactVault access role
 */
export async function getUserImpactVaultAccess(
  userId: string
): Promise<ImpactVaultAccess | null> {
  try {
    const docRef = doc(db, IMPACTVAULT_ACCESS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { userId, ...docSnap.data() } as ImpactVaultAccess;
    }
    return null;
  } catch (error) {
    console.error('Error fetching ImpactVault access:', error);
    return null;
  }
}

/**
 * Grant ImpactVault access to a user
 */
export async function grantImpactVaultAccess(
  targetUserId: string,
  role: ImpactVaultRole,
  collegeId: string,
  grantedByUserId: string,
  department?: string
): Promise<void> {
  const docRef = doc(db, IMPACTVAULT_ACCESS_COLLECTION, targetUserId);

  const accessData: Omit<ImpactVaultAccess, 'userId'> = {
    role,
    collegeId,
    department: department || '',
    grantedBy: grantedByUserId,
    grantedAt: new Date().toISOString(),
  };

  await setDoc(docRef, accessData);
}

// ---- Institution Data Operations ----

/**
 * Get all students for an institution (by college ID)
 */
export async function getInstitutionStudents(
  collegeId: string
): Promise<UserProfile[]> {
  try {
    const profilesRef = collection(db, USER_PROFILES_COLLECTION);
    const q = query(profilesRef, where('collegeId', '==', collegeId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching institution students:', error);
    return [];
  }
}

/**
 * Get all students across all institutions (for super_admin)
 */
export async function getAllStudents(): Promise<UserProfile[]> {
  try {
    const profilesRef = collection(db, USER_PROFILES_COLLECTION);
    const snapshot = await getDocs(profilesRef);
    return snapshot.docs.map((doc) => doc.data() as UserProfile);
  } catch (error) {
    console.error('Error fetching all students:', error);
    return [];
  }
}

/**
 * Get SkillDNA profiles for a batch of user IDs
 * Firestore `in` queries are limited to 30 items, so we batch
 */
export async function getSkillDNAProfilesBatch(
  userIds: string[]
): Promise<Map<string, SkillDNAProfile>> {
  const profileMap = new Map<string, SkillDNAProfile>();

  if (userIds.length === 0) return profileMap;

  try {
    // Firestore 'in' query supports up to 30 items
    const BATCH_SIZE = 30;
    const batches: string[][] = [];

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      batches.push(userIds.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const skillDNARef = collection(db, SKILLDNA_COLLECTION);
      const q = query(skillDNARef, where(documentId(), 'in', batch));
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as SkillDNAUserDocument;
        if (data.skillDNA) {
          profileMap.set(doc.id, data.skillDNA);
        }
      });
    }
  } catch (error) {
    console.error('Error fetching SkillDNA profiles:', error);
  }

  return profileMap;
}

/**
 * Get combined student + SkillDNA data for an institution
 */
export async function getInstitutionStudentsWithSkillDNA(
  collegeId: string
): Promise<StudentWithSkillDNA[]> {
  const students = await getInstitutionStudents(collegeId);

  if (students.length === 0) return [];

  const userIds = students.map((s) => s.uid);
  const skillDNAMap = await getSkillDNAProfilesBatch(userIds);

  return students.map((profile) => ({
    profile,
    skillDNA: skillDNAMap.get(profile.uid) || null,
    hasSkillDNA: skillDNAMap.has(profile.uid),
  }));
}

/**
 * Get all students with SkillDNA (for super_admin)
 */
export async function getAllStudentsWithSkillDNA(): Promise<StudentWithSkillDNA[]> {
  const students = await getAllStudents();

  if (students.length === 0) return [];

  const userIds = students.map((s) => s.uid);
  const skillDNAMap = await getSkillDNAProfilesBatch(userIds);

  return students.map((profile) => ({
    profile,
    skillDNA: skillDNAMap.get(profile.uid) || null,
    hasSkillDNA: skillDNAMap.has(profile.uid),
  }));
}

/**
 * Get distinct institution (college IDs) from all user profiles
 */
export async function getInstitutionList(): Promise<string[]> {
  try {
    const profilesRef = collection(db, USER_PROFILES_COLLECTION);
    const snapshot = await getDocs(profilesRef);

    const collegeIds = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const profile = doc.data() as UserProfile;
      if (profile.collegeId) {
        collegeIds.add(profile.collegeId);
      }
    });

    return Array.from(collegeIds).sort();
  } catch (error) {
    console.error('Error fetching institution list:', error);
    return [];
  }
}

/**
 * Get a single student's SkillDNA profile
 */
export async function getStudentSkillDNA(
  userId: string
): Promise<SkillDNAProfile | null> {
  try {
    const docRef = doc(db, SKILLDNA_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as SkillDNAUserDocument;
      return data.skillDNA || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching student SkillDNA:', error);
    return null;
  }
}
