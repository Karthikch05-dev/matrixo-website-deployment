// ============================================================
// Skill Verification — Public barrel export
// ============================================================

export * from './types';
export * from './question-bank';
export * from './test-engine';
export * from './scoring-engine';
export {
  getSkillVerification,
  getAllVerifications,
  saveSkillVerification,
  logVerificationAttempt,
  getVerificationAttempts,
  saveTestSession,
  clearTestSession,
} from './firestore-service';
