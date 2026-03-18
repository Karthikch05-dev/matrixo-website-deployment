// ============================================================
// Skill Verification API — Start Test
// POST /api/skilldna/verify/start
// Creates a new test session and returns questions (no answers)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createTestSession, DEFAULT_TEST_CONFIG } from '@/lib/skilldna/verification/test-engine';
import { hasVerificationQuestions } from '@/lib/skilldna/verification/question-bank';
import { checkCooldown } from '@/lib/skilldna/verification/scoring-engine';
import { SkillVerification, VerificationAttempt } from '@/lib/skilldna/verification/types';

export const dynamic = 'force-dynamic';

// Simple rate limiter
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
    console.log('[verify/start] Request received');

    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[verify/start] Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const tokenId = token.slice(-16);

    if (!checkRateLimit(tokenId)) {
      console.warn('[verify/start] Rate limited request', { tokenId });
      return NextResponse.json({ error: 'Rate limited. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { userId, skillName } = body;

    console.log('[verify/start] Payload parsed', {
      userId,
      skillName,
      hasExistingVerification: Boolean(body?.existingVerification),
      existingAttemptsCount: Array.isArray(body?.existingAttempts) ? body.existingAttempts.length : 0,
    });

    if (!userId || !skillName) {
      console.warn('[verify/start] Missing required fields', { userId, skillName });
      return NextResponse.json(
        { error: 'userId and skillName are required' },
        { status: 400 }
      );
    }

    // Check if questions exist for this skill
    if (!hasVerificationQuestions(skillName)) {
      console.warn('[verify/start] No question bank found for skill', { skillName });
      return NextResponse.json(
        { error: `No verification test available for "${skillName}" yet.` },
        { status: 404 }
      );
    }

    // Check cooldown — uses both verification record AND attempt history
    const existingVerification: SkillVerification | undefined = body.existingVerification || undefined;
    const existingAttempts: VerificationAttempt[] = body.existingAttempts || [];

    const cooldown = checkCooldown(existingVerification, existingAttempts);
    if (!cooldown.allowed) {
      const hoursLeft = Math.ceil(cooldown.remainingMs / (1000 * 60 * 60));
      console.warn('[verify/start] Cooldown active', {
        userId,
        skillName,
        remainingMs: cooldown.remainingMs,
      });
      return NextResponse.json(
        {
          error: cooldown.reason || `Cooldown active. You can retake this test in ~${hoursLeft} hour(s).`,
          cooldownUntil: existingVerification?.cooldownUntil,
          remainingMs: cooldown.remainingMs,
        },
        { status: 429 }
      );
    }

    // Create test session
    const session = createTestSession(userId, skillName);
    if (!session) {
      console.error('[verify/start] createTestSession returned null', { userId, skillName });
      return NextResponse.json(
        { error: 'Failed to create test session.' },
        { status: 500 }
      );
    }

    // Return session to client (questions have shuffled options, no correct answers)
    console.log('[verify/start] Session created', {
      sessionId: session.sessionId,
      questionCount: session.questions.length,
      timeLimitSeconds: session.config.timeLimitSeconds,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        skillName: session.skillName,
        questions: session.questions,
        config: {
          questionCount: session.config.questionCount,
          timeLimitSeconds: session.config.timeLimitSeconds,
          passingScorePercent: session.config.passingScorePercent,
        },
        startedAt: session.startedAt,
      },
    });
  } catch (err: any) {
    console.error('[verify/start] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
