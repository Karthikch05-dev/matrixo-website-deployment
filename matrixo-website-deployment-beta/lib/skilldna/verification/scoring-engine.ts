// ============================================================
// Skill Verification — Scoring Engine
// Server-side grading, difficulty-weighted scoring,
// strength/weakness analysis, cooldown logic, confidence meter.
// ============================================================

import {
  TestResult,
  TestSession,
  TestSubmission,
  TestSessionQuestion,
  Difficulty,
  SkillVerification,
  SkillConfidence,
  VerificationAttempt,
} from './types';
import { getQuestionBank } from './question-bank';

// ---- Difficulty weights for normalization ----

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

// ---- Cooldown: max 3 attempts per day, 24h lockout after 3 consecutive fails ----

const COOLDOWN_MS = 24 * 60 * 60 * 1000;       // fallback 24 hours
const MAX_DAILY_ATTEMPTS = 3;                    // per skill per day
const CONSECUTIVE_FAIL_LOCKOUT = 3;              // 24h lockout after N fails in a row

// ============================================================
// GRADING — server-side only
// ============================================================

/**
 * Grade a test submission against the original question bank.
 * This is the ONLY place where correct answers are accessed.
 *
 * The session's shuffled options are compared against the
 * original question bank to determine correctness.
 */
export function gradeSubmission(
  session: TestSession,
  submission: TestSubmission,
): TestResult {
  const bank = getQuestionBank(session.skillName);
  if (!bank) {
    throw new Error(`No question bank found for skill: ${session.skillName}`);
  }

  // Build lookup: questionId → original question
  const originalMap = new Map(
    bank.questions.map((q) => [q.id, q])
  );

  const diffBreakdown: TestResult['difficultyBreakdown'] = {
    easy:   { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard:   { total: 0, correct: 0 },
  };

  const tagCorrect: Record<string, number> = {};
  const tagTotal: Record<string, number> = {};

  let totalCorrect = 0;
  let weightedCorrect = 0;
  let weightedTotal = 0;
  const totalQuestions = session.questions.length;

  // Build answer map from submission
  const answerMap = new Map(
    submission.answers.map((a) => [a.questionId, a.selectedIndex])
  );

  for (const sq of session.questions) {
    const original = originalMap.get(sq.questionId);
    if (!original) continue;

    const selectedIndex = answerMap.get(sq.questionId);
    const difficulty = sq.difficulty;
    const weight = DIFFICULTY_WEIGHT[difficulty];

    diffBreakdown[difficulty].total++;
    weightedTotal += weight;

    // Determine correctness:
    // The correct answer text from the original bank
    const correctAnswerText = original.options[original.correctIndex];
    // The user's selected option text from the shuffled session
    const selectedText =
      selectedIndex !== undefined && selectedIndex >= 0 && selectedIndex < sq.options.length
        ? sq.options[selectedIndex]
        : null;

    const isCorrect = selectedText === correctAnswerText;

    if (isCorrect) {
      totalCorrect++;
      weightedCorrect += weight;
      diffBreakdown[difficulty].correct++;
    }

    // Tag tracking for strengths/weaknesses
    if (original.tags) {
      for (const tag of original.tags) {
        tagTotal[tag] = (tagTotal[tag] || 0) + 1;
        if (isCorrect) tagCorrect[tag] = (tagCorrect[tag] || 0) + 1;
      }
    }
  }

  const rawScore = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  const normalizedScore = weightedTotal > 0
    ? Math.round((weightedCorrect / weightedTotal) * 100)
    : 0;

  const passed = normalizedScore >= session.config.passingScorePercent;

  // ---- Strengths & Weaknesses ----
  const strengths: string[] = [];
  const weakAreas: string[] = [];

  for (const tag of Object.keys(tagTotal)) {
    const correct = tagCorrect[tag] || 0;
    const total = tagTotal[tag];
    const pct = total > 0 ? correct / total : 0;

    if (pct >= 0.8) {
      strengths.push(tag);
    } else if (pct < 0.5) {
      weakAreas.push(tag);
    }
  }

  // ---- Recommendations ----
  const recommendations: string[] = [];

  if (weakAreas.length > 0) {
    recommendations.push(
      `Focus on improving: ${weakAreas.join(', ')}`
    );
  }

  if (diffBreakdown.hard.total > 0 && diffBreakdown.hard.correct === 0) {
    recommendations.push(
      'Practice more advanced-level problems to build deeper understanding.'
    );
  }

  if (!passed) {
    recommendations.push(
      `You need ${session.config.passingScorePercent}% to verify this skill. Review the weak areas and try again after 24 hours.`
    );
  } else {
    recommendations.push(
      'Great job! Consider exploring advanced topics to deepen your expertise.'
    );
  }

  // ---- Time taken ----
  const startMs = new Date(session.startedAt).getTime();
  const endMs = submission.completedAt
    ? new Date(submission.completedAt).getTime()
    : Date.now();
  const timeTakenSeconds = Math.round((endMs - startMs) / 1000);

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    skillName: session.skillName,
    totalQuestions,
    correctAnswers: totalCorrect,
    rawScore,
    normalizedScore,
    passed,
    strengths,
    weakAreas,
    recommendations,
    difficultyBreakdown: diffBreakdown,
    completedAt: submission.completedAt || new Date().toISOString(),
    timeTakenSeconds,
  };
}

// ============================================================
// COOLDOWN LOGIC
// ============================================================

/**
 * Check if a user can take a verification test for a skill.
 *
 * Rules:
 *  1. Max 3 attempts per day per skill.
 *  2. 24-hour hard lockout after 3 consecutive failed attempts.
 *  3. Already-verified skills can be retaken (subject to the same limits).
 *
 * @param verification  Current verification record (if any).
 * @param attempts      All prior attempt logs for this specific skill.
 * @returns { allowed, remainingMs, reason }
 */
export function checkCooldown(
  verification: SkillVerification | undefined,
  attempts?: VerificationAttempt[],
): { allowed: boolean; remainingMs: number; reason?: string } {
  // No record at all → first attempt → always allowed
  if (!verification && (!attempts || attempts.length === 0)) {
    return { allowed: true, remainingMs: 0 };
  }

  const now = Date.now();

  // --- Rule 2: 24h lockout after N consecutive fails ---
  if (attempts && attempts.length >= CONSECUTIVE_FAIL_LOCKOUT) {
    // Check the last N attempts
    const sorted = [...attempts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastN = sorted.slice(0, CONSECUTIVE_FAIL_LOCKOUT);
    const allFailed = lastN.every((a) => !a.passed);

    if (allFailed) {
      const oldestOfN = new Date(lastN[lastN.length - 1].timestamp).getTime();
      const lockoutEnd = oldestOfN + COOLDOWN_MS;
      if (now < lockoutEnd) {
        return {
          allowed: false,
          remainingMs: lockoutEnd - now,
          reason: `${CONSECUTIVE_FAIL_LOCKOUT} consecutive fails — locked out for 24 hours`,
        };
      }
    }
  }

  // --- Rule 1: Max 3 attempts in the current 24-hour window ---
  if (attempts && attempts.length > 0) {
    const dayAgo = now - COOLDOWN_MS;
    const todayAttempts = attempts.filter(
      (a) => new Date(a.timestamp).getTime() > dayAgo
    );

    if (todayAttempts.length >= MAX_DAILY_ATTEMPTS) {
      // Find the earliest of today's attempts and calculate when the window reopens
      const earliest = todayAttempts.reduce((min, a) => {
        const t = new Date(a.timestamp).getTime();
        return t < min ? t : min;
      }, Infinity);

      const reopenAt = earliest + COOLDOWN_MS;
      if (now < reopenAt) {
        return {
          allowed: false,
          remainingMs: reopenAt - now,
          reason: `Daily limit reached (${MAX_DAILY_ATTEMPTS}/${MAX_DAILY_ATTEMPTS}) — try again later`,
        };
      }
    }
  }

  return { allowed: true, remainingMs: 0 };
}

/**
 * Build a SkillVerification record from a test result and existing data.
 * cooldownUntil is only set when the daily limit / lockout applies.
 */
export function buildVerificationRecord(
  result: TestResult,
  existing?: SkillVerification,
  attempts?: VerificationAttempt[],
): SkillVerification {
  const attemptCount = (existing?.verificationAttempts || 0) + 1;
  const bestScore = Math.max(
    existing?.bestScore || 0,
    result.normalizedScore
  );

  // Determine if cooldown is needed after this attempt
  let cooldownUntil: string | undefined;

  if (attempts) {
    // Add the current attempt to check limits
    const allAttempts = [
      ...attempts,
      { passed: result.passed, timestamp: result.completedAt } as VerificationAttempt,
    ];
    const now = Date.now();
    const dayAgo = now - COOLDOWN_MS;
    const todayAttempts = allAttempts.filter(
      (a) => new Date(a.timestamp).getTime() > dayAgo
    );

    // Check consecutive fail lockout
    const sorted = [...allAttempts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastN = sorted.slice(0, CONSECUTIVE_FAIL_LOCKOUT);
    const allFailed = lastN.length >= CONSECUTIVE_FAIL_LOCKOUT && lastN.every((a) => !a.passed);

    if (allFailed || todayAttempts.length >= MAX_DAILY_ATTEMPTS) {
      cooldownUntil = new Date(now + COOLDOWN_MS).toISOString();
    }
  }

  return {
    isVerified: result.passed,
    verificationScore: result.normalizedScore,
    verificationAttempts: attemptCount,
    lastAttemptDate: result.completedAt,
    bestScore,
    status: result.passed ? 'verified' : 'failed',
    cooldownUntil,
  };
}

/**
 * Build an attempt log entry from a test result.
 */
export function buildAttemptLog(result: TestResult): VerificationAttempt {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return {
    attemptId: `att_${ts}_${rand}`,
    userId: result.userId,
    skillName: result.skillName,
    score: result.rawScore,
    normalizedScore: result.normalizedScore,
    passed: result.passed,
    timeTakenSeconds: result.timeTakenSeconds,
    timestamp: result.completedAt,
    questionCount: result.totalQuestions,
  };
}

// ============================================================
// CONFIDENCE METER
// ============================================================

/**
 * Calculate a composite confidence score combining proficiency,
 * verification, and consistency.
 */
export function calculateConfidence(
  proficiencyScore: number,            // 0-100 (from SkillDNA)
  verification?: SkillVerification,
  attempts?: VerificationAttempt[],
): SkillConfidence {
  // Proficiency weight: direct from SkillDNA score
  const proficiencyWeight = proficiencyScore;

  // Verification weight: best verification score, 0 if never tested
  const verificationWeight = verification?.bestScore || 0;

  // Consistency weight: based on score variance across attempts
  let consistencyWeight = 50; // default if < 2 attempts
  if (attempts && attempts.length >= 2) {
    const scores = attempts.map((a) => a.normalizedScore);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + (s - mean) * (s - mean), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);
    // Low std dev = high consistency
    consistencyWeight = Math.max(0, Math.min(100, 100 - stdDev * 2));
  }

  // Weighted composite: 40% proficiency, 40% verification, 20% consistency
  const compositeScore = Math.round(
    proficiencyWeight * 0.4 +
    verificationWeight * 0.4 +
    consistencyWeight * 0.2
  );

  return {
    proficiencyWeight,
    verificationWeight,
    consistencyWeight,
    compositeScore: Math.max(0, Math.min(100, compositeScore)),
  };
}

// ============================================================
// SKILLDNA SCORE INTEGRATION
// ============================================================

/**
 * Calculate a skill score multiplier based on verification status.
 * Verified skills get 1.0x weight  (100% — full contribution).
 * Unverified skills get 0.4x weight (40% — must verify to count fully).
 * Failed skills get 0.2x weight     (20% — significant penalty).
 */
export function getVerificationMultiplier(
  verification?: SkillVerification,
): number {
  if (!verification) return 0.4;          // unverified
  if (verification.isVerified) return 1.0; // verified
  return 0.2;                              // failed
}
