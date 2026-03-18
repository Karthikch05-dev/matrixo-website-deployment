// ============================================================
// Skill Verification API — Submit / Grade Test
// POST /api/skilldna/verify/submit
// Grades the submission server-side, returns result.
// Correct answers are NEVER sent to the client.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  gradeSubmission,
  buildVerificationRecord,
  buildAttemptLog,
} from '@/lib/skilldna/verification/scoring-engine';
import { TestSession, TestSubmission, TestSessionQuestion, SkillVerification, VerificationAttempt } from '@/lib/skilldna/verification/types';

export const dynamic = 'force-dynamic';

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(id: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(id);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(id, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[verify/submit] Request received');

    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[verify/submit] Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const tokenId = token.slice(-16);

    if (!checkRateLimit(tokenId)) {
      console.warn('[verify/submit] Rate limited request', { tokenId });
      return NextResponse.json({ error: 'Rate limited.' }, { status: 429 });
    }

    const body = await request.json();
    const { userId, sessionId, skillName, questions, answers, startedAt, config, existingVerification, existingAttempts } = body;

    console.log('[verify/submit] Payload parsed', {
      userId,
      sessionId,
      skillName,
      questionCount: Array.isArray(questions) ? questions.length : 0,
      answerCount: Array.isArray(answers) ? answers.length : 0,
      hasExistingVerification: Boolean(existingVerification),
      existingAttemptsCount: Array.isArray(existingAttempts) ? existingAttempts.length : 0,
    });

    if (!userId || !sessionId || !skillName || !answers || !questions) {
      console.warn('[verify/submit] Missing required fields', {
        userId,
        sessionId,
        skillName,
        hasAnswers: Boolean(answers),
        hasQuestions: Boolean(questions),
      });
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, skillName, questions, answers' },
        { status: 400 }
      );
    }

    // Validate answers is an array
    if (!Array.isArray(answers)) {
      console.warn('[verify/submit] Invalid answers payload type');
      return NextResponse.json(
        { error: 'answers must be an array' },
        { status: 400 }
      );
    }

    // Reconstruct session for grading
    const session: TestSession = {
      sessionId,
      userId,
      skillName,
      questions: questions as TestSessionQuestion[],
      config: config || {
        questionCount: questions.length,
        timeLimitSeconds: 600,
        passingScorePercent: 70,
        difficultyMix: { easy: 2, medium: 3, hard: 2 },
      },
      startedAt: startedAt || new Date().toISOString(),
      status: 'completed',
    };

    const submission: TestSubmission = {
      sessionId,
      answers,
      completedAt: new Date().toISOString(),
    };

    // Grade server-side
    const result = gradeSubmission(session, submission);

    // Build new verification record (client passes existing if any)
    const existing: SkillVerification | undefined = existingVerification || undefined;
    const priorAttempts: VerificationAttempt[] = existingAttempts || [];
    const verification = buildVerificationRecord(result, existing, priorAttempts);

    // Build attempt log
    const attempt = buildAttemptLog(result);

    console.log('[verify/submit] Submission graded', {
      sessionId,
      passed: result.passed,
      normalizedScore: result.normalizedScore,
      totalQuestions: result.totalQuestions,
    });

    // Return result (without correct answers)
    return NextResponse.json({
      success: true,
      data: {
        passed: result.passed,
        rawScore: result.rawScore,
        normalizedScore: result.normalizedScore,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        strengths: result.strengths,
        weakAreas: result.weakAreas,
        recommendations: result.recommendations,
        difficultyBreakdown: result.difficultyBreakdown,
        timeTakenSeconds: result.timeTakenSeconds,
        verification: {
          isVerified: verification.isVerified,
          verificationScore: verification.verificationScore,
          verificationAttempts: verification.verificationAttempts,
          lastAttemptDate: verification.lastAttemptDate,
          bestScore: verification.bestScore,
          status: verification.status,
          cooldownUntil: verification.cooldownUntil,
        },
        attempt,
      },
    });
  } catch (err: any) {
    console.error('[verify/submit] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
