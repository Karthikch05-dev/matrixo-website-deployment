// ============================================================
// Skill Verification — Firestore Service
// Persistence layer for verification records and attempt logs
// Stored under: skillDNA_users/{userId}
// ============================================================

import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { SkillVerification, VerificationAttempt, TestSession } from './types';

const SKILLDNA_COLLECTION = 'skillDNA_users';

// ============================================================
// Read verification data
// ============================================================

/**
 * Get verification record for a specific skill.
 * Stored at: skillDNA_users/{userId}.verifications.{normalizedSkillName}
 */
export async function getSkillVerification(
  userId: string,
  skillName: string,
): Promise<SkillVerification | null> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  const key = normalizeKey(skillName);
  return data?.verifications?.[key] || null;
}

/**
 * Get all verification records for a user.
 * Returns a map of skillName → SkillVerification.
 */
export async function getAllVerifications(
  userId: string,
): Promise<Record<string, SkillVerification>> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return {};
  return snap.data()?.verifications || {};
}

// ============================================================
// Write verification data
// ============================================================

/**
 * Save or update verification record for a skill.
 * Uses dot-notation to avoid overwriting other verifications.
 */
export async function saveSkillVerification(
  userId: string,
  skillName: string,
  verification: SkillVerification,
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const key = normalizeKey(skillName);

  await updateDoc(docRef, {
    [`verifications.${key}`]: verification,
  });
}

/**
 * Log a verification attempt.
 * Stored as an array at: skillDNA_users/{userId}.verificationAttempts
 */
export async function logVerificationAttempt(
  userId: string,
  attempt: VerificationAttempt,
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);

  await updateDoc(docRef, {
    verificationAttempts: arrayUnion(attempt),
  });
}

/**
 * Get all verification attempts for a user (or filtered by skill).
 */
export async function getVerificationAttempts(
  userId: string,
  skillName?: string,
): Promise<VerificationAttempt[]> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];

  const attempts: VerificationAttempt[] =
    snap.data()?.verificationAttempts || [];

  if (skillName) {
    const key = skillName.toLowerCase().trim();
    return attempts.filter(
      (a) => a.skillName.toLowerCase().trim() === key
    );
  }

  return attempts;
}

// ============================================================
// Session persistence (temporary, for validation)
// ============================================================

/**
 * Save an active test session (server-side reference for grading).
 * Stored at: skillDNA_users/{userId}.activeSessions.{sessionId}
 *
 * NOTE: This stores the FULL session including question→correctAnswer
 * mapping (via question IDs). The actual correct answers are resolved
 * from the question bank during grading, NOT stored here.
 */
export async function saveTestSession(
  userId: string,
  session: TestSession,
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);

  await updateDoc(docRef, {
    [`activeSessions.${session.sessionId}`]: {
      sessionId: session.sessionId,
      skillName: session.skillName,
      questionIds: session.questions.map((q) => q.questionId),
      questionOptions: session.questions.map((q) => q.options),
      config: session.config,
      startedAt: session.startedAt,
      status: session.status,
    },
  });
}

/**
 * Remove a completed session from active sessions.
 */
export async function clearTestSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const docRef = doc(db, SKILLDNA_COLLECTION, userId);
  // We can't delete a nested field easily with updateDoc,
  // so set it to null which effectively removes it
  await updateDoc(docRef, {
    [`activeSessions.${sessionId}`]: null,
  });
}

// ============================================================
// Helpers
// ============================================================

/**
 * Normalize a skill name to a valid Firestore key.
 * Firestore keys cannot contain '.', '/', or certain chars.
 */
function normalizeKey(skillName: string): string {
  return skillName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_');
}
