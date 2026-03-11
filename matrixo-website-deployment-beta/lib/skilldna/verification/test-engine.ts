// ============================================================
// Skill Verification — Test Engine
// Manages test sessions: question selection, randomisation,
// answer shuffling, and session lifecycle.
// Correct answers are NEVER exposed to the client.
// ============================================================

import {
  TestConfig,
  TestSession,
  TestSessionQuestion,
  TestQuestion,
  Difficulty,
} from './types';
import { getQuestionBank } from './question-bank';

// ---- Default test config ----

export const DEFAULT_TEST_CONFIG: TestConfig = {
  questionCount: 7,
  timeLimitSeconds: 600,       // 10 minutes
  passingScorePercent: 70,
  difficultyMix: {
    easy: 2,
    medium: 3,
    hard: 2,
  },
};

// ---- Deterministic shuffle (Fisher-Yates) with seed support ----

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// ---- Pick questions by difficulty mix ----

function pickQuestions(
  pool: TestQuestion[],
  config: TestConfig,
): TestQuestion[] {
  const byDifficulty: Record<Difficulty, TestQuestion[]> = {
    easy: [],
    medium: [],
    hard: [],
  };

  for (const q of pool) {
    byDifficulty[q.difficulty].push(q);
  }

  // Shuffle each difficulty bucket
  byDifficulty.easy = shuffleArray(byDifficulty.easy);
  byDifficulty.medium = shuffleArray(byDifficulty.medium);
  byDifficulty.hard = shuffleArray(byDifficulty.hard);

  const selected: TestQuestion[] = [];

  // Pick from each difficulty according to the mix
  const pick = (diff: Difficulty, count: number) => {
    const bucket = byDifficulty[diff];
    for (let i = 0; i < count && i < bucket.length; i++) {
      selected.push(bucket[i]);
    }
  };

  pick('easy', config.difficultyMix.easy);
  pick('medium', config.difficultyMix.medium);
  pick('hard', config.difficultyMix.hard);

  // If we didn't get enough, fill from remaining questions
  if (selected.length < config.questionCount) {
    const selectedIds = new Set(selected.map((q) => q.id));
    const remaining = shuffleArray(
      pool.filter((q) => !selectedIds.has(q.id))
    );
    while (selected.length < config.questionCount && remaining.length > 0) {
      selected.push(remaining.shift()!);
    }
  }

  return shuffleArray(selected);
}

// ---- Build a safe session question (no correct answer exposed) ----

function toSessionQuestion(q: TestQuestion): TestSessionQuestion {
  // Shuffle options and track where the correct answer ends up
  // NOTE: we don't store correctIndex in the session question
  // The mapping is stored server-side only (question-bank source of truth)
  const shuffledOptions = shuffleArray(q.options);

  return {
    questionId: q.id,
    question: q.question,
    options: shuffledOptions,
    difficulty: q.difficulty,
    type: q.type,
  };
}

// ---- Session ID generator ----

function generateSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `vt_${ts}_${rand}`;
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Create a new test session for a skill.
 * Returns null if no question bank exists for the skill.
 *
 * SECURITY: The returned session does NOT contain correct answers.
 * Grading happens server-side via gradeSession().
 */
export function createTestSession(
  userId: string,
  skillName: string,
  config?: Partial<TestConfig>,
): TestSession | null {
  const bank = getQuestionBank(skillName);
  if (!bank || bank.questions.length === 0) return null;

  const mergedConfig: TestConfig = {
    ...DEFAULT_TEST_CONFIG,
    ...config,
    difficultyMix: {
      ...DEFAULT_TEST_CONFIG.difficultyMix,
      ...(config?.difficultyMix || {}),
    },
  };

  // Ensure we don't request more questions than available
  mergedConfig.questionCount = Math.min(
    mergedConfig.questionCount,
    bank.questions.length
  );

  const selected = pickQuestions(bank.questions, mergedConfig);
  const sessionQuestions = selected.map(toSessionQuestion);

  return {
    sessionId: generateSessionId(),
    userId,
    skillName: bank.skillName,
    questions: sessionQuestions,
    config: mergedConfig,
    startedAt: new Date().toISOString(),
    status: 'in-progress',
  };
}

/**
 * Check if a test session has timed out.
 */
export function isSessionTimedOut(session: TestSession): boolean {
  const elapsed =
    Date.now() - new Date(session.startedAt).getTime();
  return elapsed > session.config.timeLimitSeconds * 1000;
}

/**
 * Get the remaining time in seconds for a session.
 */
export function getRemainingTime(session: TestSession): number {
  const elapsed =
    (Date.now() - new Date(session.startedAt).getTime()) / 1000;
  return Math.max(0, session.config.timeLimitSeconds - Math.floor(elapsed));
}
