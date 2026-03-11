// ============================================================
// Skill Verification Test Engine — Type Definitions
// Clean separation of verification domain types
// ============================================================

export type QuestionType = 'mcq' | 'coding' | 'scenario';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type VerificationStatus = 'not-verified' | 'verified' | 'failed';

// ---- Question Bank ----

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;            // index into options[]
  difficulty: Difficulty;
  type: QuestionType;
  explanation?: string;            // shown after answering
  tags?: string[];                 // sub-topic tags
}

export interface SkillQuestionBank {
  skillName: string;               // normalised lowercase
  category: string;
  questions: TestQuestion[];
  lastUpdated: string;
}

// ---- Test Session ----

export interface TestConfig {
  questionCount: number;           // 5-10
  timeLimitSeconds: number;        // e.g. 600 = 10 min
  passingScorePercent: number;     // e.g. 70
  difficultyMix: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface TestSession {
  sessionId: string;
  userId: string;
  skillName: string;
  questions: TestSessionQuestion[];
  config: TestConfig;
  startedAt: string;
  completedAt?: string;
  status: 'in-progress' | 'completed' | 'timed-out';
}

export interface TestSessionQuestion {
  questionId: string;
  question: string;
  options: string[];               // shuffled options (no correct answer exposed)
  difficulty: Difficulty;
  type: QuestionType;
  selectedIndex?: number;          // user's answer
  isCorrect?: boolean;             // set after grading
}

// ---- Answers & Results ----

export interface TestSubmission {
  sessionId: string;
  answers: { questionId: string; selectedIndex: number }[];
  completedAt: string;
}

export interface TestResult {
  sessionId: string;
  userId: string;
  skillName: string;
  totalQuestions: number;
  correctAnswers: number;
  rawScore: number;                // 0-100 percentage
  normalizedScore: number;         // difficulty-weighted 0-100
  passed: boolean;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  difficultyBreakdown: {
    easy:   { total: number; correct: number };
    medium: { total: number; correct: number };
    hard:   { total: number; correct: number };
  };
  completedAt: string;
  timeTakenSeconds: number;
}

// ---- Skill Verification Record (stored on user) ----

export interface SkillVerification {
  isVerified: boolean;
  verificationScore: number;       // last normalized score
  verificationAttempts: number;
  lastAttemptDate: string;
  bestScore: number;
  status: VerificationStatus;
  cooldownUntil?: string;          // ISO timestamp
}

// ---- Attempt Log (Firestore sub-collection) ----

export interface VerificationAttempt {
  attemptId: string;
  userId: string;
  skillName: string;
  score: number;
  normalizedScore: number;
  passed: boolean;
  timeTakenSeconds: number;
  timestamp: string;
  questionCount: number;
}

// ---- Confidence Meter ----

export interface SkillConfidence {
  proficiencyWeight: number;       // 0-100
  verificationWeight: number;      // 0-100
  consistencyWeight: number;       // 0-100 based on attempt variance
  compositeScore: number;          // weighted average 0-100
}
