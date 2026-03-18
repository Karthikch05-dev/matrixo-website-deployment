// ============================================================
// SkillDNA™ — Skill Verification Test Modal
// Full test-taking UI with timer, question navigation,
// result display, and verification badge integration.
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner,
  FaArrowRight, FaArrowLeft, FaTrophy, FaRedo, FaShieldAlt,
  FaExclamationTriangle, FaLightbulb, FaChartBar,
} from 'react-icons/fa';
import { TestSessionQuestion, SkillVerification, VerificationAttempt } from '@/lib/skilldna/verification/types';
import {
  getSkillVerification,
  saveSkillVerification,
  logVerificationAttempt,
  getVerificationAttempts,
} from '@/lib/skilldna/verification/firestore-service';

// ---- Types for the modal ----

const MAX_DAILY_ATTEMPTS = 3;
const TEST_REQUEST_TIMEOUT_MS = 10000;

interface VerificationTestModalProps {
  skillName: string;
  userId: string;
  authToken: string;
  onClose: () => void;
  onVerified: (result: VerificationResult) => void;
}

interface VerificationResult {
  passed: boolean;
  rawScore: number;
  normalizedScore: number;
  totalQuestions: number;
  correctAnswers: number;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  difficultyBreakdown: {
    easy: { total: number; correct: number };
    medium: { total: number; correct: number };
    hard: { total: number; correct: number };
  };
  timeTakenSeconds: number;
  verification: SkillVerification;
  attempt: VerificationAttempt;
}

type ModalPhase = 'loading' | 'intro' | 'test' | 'submitting' | 'result' | 'error';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.floor(timeoutMs / 1000)}s`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.floor(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ---- Timer hook ----

function useTimer(
  totalSeconds: number,
  isActive: boolean,
  onTimeout: () => void,
) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

  useEffect(() => {
    if (!isActive) return;
    setRemaining(totalSeconds);
  }, [totalSeconds, isActive]);

  useEffect(() => {
    if (!isActive || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          callbackRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, remaining]);

  return remaining;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function VerificationTestModal({
  skillName,
  userId,
  authToken,
  onClose,
  onVerified,
}: VerificationTestModalProps) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---- State ----
  const [phase, setPhase] = useState<ModalPhase>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    questions: TestSessionQuestion[];
    config: { questionCount: number; timeLimitSeconds: number; passingScorePercent: number };
    startedAt: string;
  } | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    console.log('[VerificationTestModal] phase changed:', phase);
  }, [phase]);

  const timeLimitSec = sessionData?.config.timeLimitSeconds || 600;

  // ---- Timer ----
  const remaining = useTimer(
    timeLimitSec,
    timerActive,
    () => handleSubmit(), // auto-submit on timeout
  );

  // ---- Load test session ----
  useEffect(() => {
    startTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTest = async () => {
    console.log('[VerificationTestModal] startTest initiated', { userId, skillName });
    setPhase('loading');
    setErrorMsg('');

    try {
      // Fetch existing verification + attempt history for cooldown check
      const [existingVerification, existingAttempts] = await withTimeout(
        Promise.all([
          getSkillVerification(userId, skillName),
          getVerificationAttempts(userId, skillName),
        ]),
        TEST_REQUEST_TIMEOUT_MS,
        'Verification metadata fetch',
      );

      console.log('[VerificationTestModal] metadata loaded', {
        hasExistingVerification: Boolean(existingVerification),
        attemptsCount: existingAttempts.length,
      });

      const res = await fetchWithTimeout('/api/skilldna/verify/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          skillName,
          existingVerification: existingVerification || undefined,
          existingAttempts,
        }),
      }, TEST_REQUEST_TIMEOUT_MS);

      const json = await withTimeout(res.json(), TEST_REQUEST_TIMEOUT_MS, 'Verification start response parse');

      console.log('[VerificationTestModal] /verify/start response', {
        status: res.status,
        ok: res.ok,
        hasData: Boolean(json?.data),
        error: json?.error,
      });

      if (!res.ok) {
        if (isMountedRef.current) {
          setErrorMsg(json.error || 'Failed to start test.');
          setPhase('error');
        }
        return;
      }

      if (!json?.data?.sessionId || !Array.isArray(json?.data?.questions) || !json?.data?.config) {
        if (isMountedRef.current) {
          setErrorMsg('Verification test response is incomplete. Please try again.');
          setPhase('error');
        }
        return;
      }

      if (isMountedRef.current) {
        setSessionData(json.data);
        setCurrentIdx(0);
        setAnswers({});
        setPhase('intro');
      }
    } catch (err: any) {
      console.error('[VerificationTestModal] startTest failed', err);
      if (isMountedRef.current) {
        setErrorMsg(err.message || 'Network error');
        setPhase('error');
      }
    }
  };

  const beginTest = () => {
    setPhase('test');
    setTimerActive(true);
  };

  // ---- Answer selection ----
  const selectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  // ---- Navigation ----
  const goNext = () => {
    if (sessionData && currentIdx < sessionData.questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
    }
  };

  // ---- Submit ----
  const handleSubmit = useCallback(async () => {
    if (!sessionData) return;
    setTimerActive(false);
    setPhase('submitting');
    console.log('[VerificationTestModal] submit initiated', {
      sessionId: sessionData.sessionId,
      answeredCount: Object.keys(answers).length,
      questionCount: sessionData.questions.length,
    });

    try {
      const answerArray = sessionData.questions.map((q) => ({
        questionId: q.questionId,
        selectedIndex: answers[q.questionId] ?? -1,
      }));

      // Fetch existing verification + attempts for the API to build updated record
      const [existingVerification, existingAttempts] = await withTimeout(
        Promise.all([
          getSkillVerification(userId, skillName),
          getVerificationAttempts(userId, skillName),
        ]),
        TEST_REQUEST_TIMEOUT_MS,
        'Verification metadata fetch',
      );

      const res = await fetchWithTimeout('/api/skilldna/verify/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          sessionId: sessionData.sessionId,
          skillName,
          questions: sessionData.questions,
          answers: answerArray,
          startedAt: sessionData.startedAt,
          config: sessionData.config,
          existingVerification: existingVerification || undefined,
          existingAttempts,
        }),
      }, TEST_REQUEST_TIMEOUT_MS);

      const json = await withTimeout(res.json(), TEST_REQUEST_TIMEOUT_MS, 'Verification submit response parse');

      console.log('[VerificationTestModal] /verify/submit response', {
        status: res.status,
        ok: res.ok,
        hasData: Boolean(json?.data),
        error: json?.error,
      });

      if (!res.ok) {
        if (isMountedRef.current) {
          setErrorMsg(json.error || 'Submission failed.');
          setPhase('error');
        }
        return;
      }

      // Save verification record to Firestore (client has auth context)
      const data: VerificationResult = json.data;
      await saveSkillVerification(userId, skillName, data.verification);
      await logVerificationAttempt(userId, data.attempt);

      if (isMountedRef.current) {
        setResult(data);
        setPhase('result');
      }
      onVerified(data);
    } catch (err: any) {
      console.error('[VerificationTestModal] submit failed', err);
      if (isMountedRef.current) {
        setErrorMsg(err.message || 'Network error');
        setPhase('error');
      }
    }
  }, [sessionData, answers, authToken, userId, skillName, onVerified]);

  // ---- Derived ----
  const totalQ = sessionData?.questions.length || 0;
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = sessionData?.questions[currentIdx];
  const isLastQuestion = currentIdx === totalQ - 1;
  const allAnswered = answeredCount === totalQ;

  // ---- Render ----

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={phase === 'test' ? undefined : onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl"
      >
        {/* Close button (hidden during test) */}
        {phase !== 'test' && phase !== 'submitting' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10"
          >
            <FaTimes />
          </button>
        )}

        {/* ---- LOADING ---- */}
        {phase === 'loading' && (
          <div className="p-12 text-center">
            <FaSpinner className="text-4xl text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Preparing your verification test...</p>
          </div>
        )}

        {/* ---- ERROR ---- */}
        {phase === 'error' && (
          <div className="p-8 text-center">
            <FaExclamationTriangle className="text-4xl text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Cannot Start Test</h3>
            <p className="text-gray-400 mb-6 text-sm">{errorMsg}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={startTest}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ---- INTRO ---- */}
        {phase === 'intro' && sessionData && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <FaShieldAlt className="text-2xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Verify: {skillName}
              </h2>
              <p className="text-gray-500 text-sm">
                Prove your proficiency and earn a Verified badge
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                <p className="text-2xl font-bold text-purple-400">{sessionData.config.questionCount}</p>
                <p className="text-xs text-gray-500">Questions</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                <p className="text-2xl font-bold text-blue-400">{formatTime(sessionData.config.timeLimitSeconds)}</p>
                <p className="text-xs text-gray-500">Time Limit</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                <p className="text-2xl font-bold text-green-400">{sessionData.config.passingScorePercent}%</p>
                <p className="text-xs text-gray-500">To Pass</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-300 flex items-start gap-2">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span>
                  Once you start, the timer cannot be paused. Questions are randomized.
                  You need {sessionData.config.passingScorePercent}% to get verified.
                </span>
              </p>
            </div>

            <button
              onClick={beginTest}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              Start Test <FaArrowRight />
            </button>
          </div>
        )}

        {/* ---- TEST ---- */}
        {phase === 'test' && sessionData && currentQuestion && (
          <div className="p-6">
            {/* Header: Timer + Progress */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Q {currentIdx + 1} / {totalQ}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-500/20 text-green-400'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                {currentQuestion.type === 'scenario' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">
                    Scenario
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
                remaining <= 60
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : remaining <= 120
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-gray-800 text-gray-300'
              }`}>
                <FaClock size={12} />
                {formatTime(remaining)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-800 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
              />
            </div>

            {/* Question */}
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 leading-relaxed">
                {currentQuestion.question}
              </h3>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, oi) => {
                  const isSelected = answers[currentQuestion.questionId] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(currentQuestion.questionId, oi)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 text-white'
                          : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-sm">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Question dots */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {sessionData.questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentIdx
                      ? 'bg-purple-500 scale-125'
                      : answers[q.questionId] !== undefined
                      ? 'bg-green-500/60'
                      : 'bg-gray-700'
                  }`}
                  title={`Question ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-all flex items-center gap-1.5 text-sm"
              >
                <FaArrowLeft size={12} /> Previous
              </button>

              {isLastQuestion ? (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!allAnswered}
                  className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                    allAnswered
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit Test <FaCheckCircle />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="px-4 py-2 text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1.5 text-sm"
                >
                  Next <FaArrowRight size={12} />
                </button>
              )}
            </div>

            {/* Answered counter */}
            <p className="text-center text-xs text-gray-600 mt-3">
              {answeredCount} of {totalQ} answered
              {!allAnswered && isLastQuestion && (
                <span className="text-amber-400 ml-2">Answer all to submit</span>
              )}
            </p>
          </div>
        )}

        {/* ---- SUBMITTING ---- */}
        {phase === 'submitting' && (
          <div className="p-12 text-center">
            <FaSpinner className="text-4xl text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Grading your answers...</p>
          </div>
        )}

        {/* ---- RESULT ---- */}
        {phase === 'result' && result && (
          <div className="p-8">
            {/* Pass/Fail header */}
            <div className="text-center mb-6">
              {result.passed ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <FaTrophy className="text-3xl text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-400 mb-1">Skill Verified!</h2>
                  <p className="text-gray-400 text-sm">{skillName} is now a verified skill on your profile</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                    <FaTimesCircle className="text-3xl text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-400 mb-1">Not Yet Verified</h2>
                  <p className="text-gray-400 text-sm">Keep practicing — you have {MAX_DAILY_ATTEMPTS} attempts per day</p>
                </>
              )}
            </div>

            {/* Score cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                <p className={`text-2xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {result.normalizedScore}%
                </p>
                <p className="text-xs text-gray-500">Score</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                <p className="text-2xl font-bold text-blue-400">
                  {result.correctAnswers}/{result.totalQuestions}
                </p>
                <p className="text-xs text-gray-500">Correct</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-100 dark:bg-gray-800/50">
                <p className="text-2xl font-bold text-purple-400">
                  {formatTime(result.timeTakenSeconds)}
                </p>
                <p className="text-xs text-gray-500">Time</p>
              </div>
            </div>

            {/* Difficulty breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FaChartBar size={12} /> Difficulty Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {(['easy', 'medium', 'hard'] as const).map((diff) => {
                  const bd = result.difficultyBreakdown[diff];
                  const pct = bd.total > 0 ? Math.round((bd.correct / bd.total) * 100) : 0;
                  return (
                    <div key={diff} className="p-3 rounded-xl bg-gray-800/30 border border-gray-700/50">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs font-medium capitalize ${
                          diff === 'easy' ? 'text-green-400' : diff === 'medium' ? 'text-yellow-400' : 'text-red-400'
                        }`}>{diff}</span>
                        <span className="text-xs text-gray-400">{bd.correct}/{bd.total}</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            diff === 'easy' ? 'bg-green-500' : diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                  <FaCheckCircle size={12} /> Strengths
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.strengths.map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weak areas */}
            {result.weakAreas.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                  <FaTimesCircle size={12} /> Areas to Improve
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.weakAreas.map((w) => (
                    <span key={w} className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <FaLightbulb size={12} /> Recommendations
                </h4>
                <ul className="space-y-1.5">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">{'\u2022'}</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all font-medium text-sm"
              >
                Close
              </button>
              {!result.passed && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <FaRedo size={12} /> Try Again Later
                </button>
              )}
            </div>

            {/* Attempt info */}
            <p className="text-center text-xs text-gray-600 mt-3">
              Attempt #{result.verification.verificationAttempts} &middot; Best score: {result.verification.bestScore}%
              {result.verification.cooldownUntil && !result.passed && (
                <span className="ml-1">&middot; Daily limit may apply ({MAX_DAILY_ATTEMPTS}/day)</span>
              )}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
