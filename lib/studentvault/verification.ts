// Server-only: student verification for StudentVault.
//
// Verification state is written ONLY by the server (Admin SDK). It never lives
// on UserProfiles, which the owner can edit freely.
import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { emailLayout, sendEmail } from '@/lib/email/send'
import { verificationExpiry, accessEndForGraduationYear, formatAccessDate } from './eligibility'

export const VERIFICATIONS_COLLECTION = 'student_verifications'
export const OTP_COLLECTION = 'student_verification_otps'

export const OTP_RULES = {
  length: 6,
  ttlMs: 10 * 60 * 1000,
  maxAttempts: 5,
  resendCooldownMs: 60 * 1000,
  maxSendsPerDay: 8,
} as const

export type StudyStatus = 'studying' | 'changed_college' | 'graduated'
export type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'expired' | 'rejected' | 'graduated'
export type IdReviewStatus = 'pending' | 'approved' | 'rejected'
export type IdDocType = 'student_id' | 'bonafide' | 'fee_receipt' | 'admission_letter'

export interface VerificationRecord {
  status: VerificationStatus
  college: string
  graduationYear: number | null
  studyStatus: StudyStatus | null
  afterGraduation: string
  email: { address: string; verifiedAt: string } | null
  id: {
    docType: IdDocType
    storagePath: string
    uploadedAt: string
    reviewStatus: IdReviewStatus
    reviewedAt: string | null
    reviewedBy: string
    reviewNote: string
  } | null
  verifiedAt: string | null
  expiresAt: string | null
  updatedAt: string | null
}

export interface VerificationProfile {
  college: string
  graduationYear: number
  studyStatus: StudyStatus
  afterGraduation?: string
}

function iso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  const v = value as { toDate?: () => Date }
  if (typeof v.toDate === 'function') return v.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return null
}

function normalize(raw: Record<string, any> | undefined): VerificationRecord {
  const r = raw ?? {}
  const expiresAt = iso(r.expiresAt)
  let status: VerificationStatus = r.status ?? 'unverified'
  // Verification lapses on its own at the cutoff — no cron needed.
  if (status === 'verified' && expiresAt && new Date(expiresAt).getTime() < Date.now()) status = 'expired'
  return {
    status,
    college: r.college ?? '',
    graduationYear: typeof r.graduationYear === 'number' ? r.graduationYear : null,
    studyStatus: r.studyStatus ?? null,
    afterGraduation: r.afterGraduation ?? '',
    email: r.email?.address ? { address: r.email.address, verifiedAt: iso(r.email.verifiedAt) ?? '' } : null,
    id: r.id?.storagePath
      ? {
          docType: r.id.docType ?? 'student_id',
          storagePath: r.id.storagePath,
          uploadedAt: iso(r.id.uploadedAt) ?? '',
          reviewStatus: r.id.reviewStatus ?? 'pending',
          reviewedAt: iso(r.id.reviewedAt),
          reviewedBy: r.id.reviewedBy ?? '',
          reviewNote: r.id.reviewNote ?? '',
        }
      : null,
    verifiedAt: iso(r.verifiedAt),
    expiresAt,
    updatedAt: iso(r.updatedAt),
  }
}

export async function getVerification(uid: string): Promise<VerificationRecord> {
  const doc = await getAdminFirestore().collection(VERIFICATIONS_COLLECTION).doc(uid).get()
  return normalize(doc.exists ? (doc.data() as Record<string, any>) : undefined)
}

/** Public-safe view for the student themself (no storage paths). */
export function publicVerification(v: VerificationRecord) {
  return {
    status: v.status,
    college: v.college,
    graduationYear: v.graduationYear,
    studyStatus: v.studyStatus,
    emailAddress: v.email?.address ?? null,
    emailVerifiedAt: v.email?.verifiedAt ?? null,
    idReviewStatus: v.id?.reviewStatus ?? null,
    idReviewNote: v.id?.reviewStatus === 'rejected' ? v.id.reviewNote : '',
    verifiedAt: v.verifiedAt,
    expiresAt: v.expiresAt,
  }
}

function historyEntry(event: string, details: Record<string, unknown> = {}) {
  return { at: new Date(), event, ...details }
}

async function markVerified(uid: string, profile: VerificationProfile, method: 'email' | 'id', extra: Record<string, unknown>) {
  const { FieldValue } = await import('firebase-admin/firestore')
  const now = new Date()
  const expiresAt = verificationExpiry(profile.graduationYear, now)
  await getAdminFirestore()
    .collection(VERIFICATIONS_COLLECTION)
    .doc(uid)
    .set(
      {
        status: 'verified',
        college: profile.college,
        graduationYear: profile.graduationYear,
        studyStatus: profile.studyStatus,
        afterGraduation: profile.afterGraduation ?? '',
        verifiedAt: now,
        expiresAt,
        updatedAt: now,
        ...extra,
        history: FieldValue.arrayUnion(historyEntry(`verified_${method}`, { graduationYear: profile.graduationYear })),
      },
      { merge: true }
    )
  return expiresAt
}

/** Records a "graduated" answer at re-verification: access ends at the cutoff. */
export async function recordGraduated(uid: string, graduationYear: number, afterGraduation: string) {
  const { FieldValue } = await import('firebase-admin/firestore')
  const now = new Date()
  const cutoff = accessEndForGraduationYear(graduationYear)
  await getAdminFirestore()
    .collection(VERIFICATIONS_COLLECTION)
    .doc(uid)
    .set(
      {
        status: cutoff.getTime() > now.getTime() ? 'verified' : 'graduated',
        studyStatus: 'graduated',
        graduationYear,
        afterGraduation: afterGraduation.slice(0, 200),
        expiresAt: cutoff,
        updatedAt: now,
        history: FieldValue.arrayUnion(historyEntry('graduated', { graduationYear, afterGraduation: afterGraduation.slice(0, 200) })),
      },
      { merge: true }
    )
}

// ── Email OTP ──────────────────────────────────────────────────────────────

function hashCode(uid: string, email: string, code: string): string {
  const secret = process.env.OTP_HASH_SECRET || process.env.RAZORPAY_KEY_SECRET || 'matrixo-studentvault-otp'
  return createHmac('sha256', secret).update(`${uid}:${email}:${code}`).digest('hex')
}

export type SendOtpResult =
  | { ok: true; cooldownSeconds: number }
  | { ok: false; status: number; error: string; retryAfter?: number; code?: string }

export async function sendEmailOtp(uid: string, email: string, profile: VerificationProfile): Promise<SendOtpResult> {
  const firestore = getAdminFirestore()
  const ref = firestore.collection(OTP_COLLECTION).doc(uid)
  const now = Date.now()
  const existing = await ref.get()
  const data = existing.exists ? (existing.data() as Record<string, any>) : {}

  const lastSent = data.lastSentAt?.toMillis?.() ?? 0
  if (now - lastSent < OTP_RULES.resendCooldownMs) {
    const retryAfter = Math.ceil((OTP_RULES.resendCooldownMs - (now - lastSent)) / 1000)
    return { ok: false, status: 429, error: `Wait ${retryAfter}s before requesting another code.`, retryAfter }
  }

  const windowStart = data.windowStart?.toMillis?.() ?? 0
  const inWindow = now - windowStart < 24 * 60 * 60 * 1000
  const sendsToday = inWindow ? (data.sendsToday ?? 0) : 0
  if (sendsToday >= OTP_RULES.maxSendsPerDay) {
    return { ok: false, status: 429, error: 'Too many codes today. Try again tomorrow, or upload your student ID instead.' }
  }

  const code = randomInt(0, 10 ** OTP_RULES.length).toString().padStart(OTP_RULES.length, '0')
  const expiresAt = new Date(now + OTP_RULES.ttlMs)

  const sent = await sendEmail({
    to: email,
    subject: `${code} is your matriXO verification code`,
    text: `Your matriXO StudentVault verification code is ${code}. It expires in 10 minutes. If you didn't ask for this, you can ignore this email.`,
    html: emailLayout(
      'Verify your college email',
      `<p style="margin:0 0 16px">Enter this code to confirm you're a student and unlock StudentVault:</p>
<p style="font-size:34px;font-weight:700;letter-spacing:0.18em;margin:0 0 16px;color:#1d1d1f">${code}</p>
<p style="margin:0 0 8px">It expires in 10 minutes.</p>
<p style="margin:0;color:#86868b;font-size:13px">If you didn't request this, ignore this email — nothing changes on your account.</p>`
    ),
  })

  if (!sent.ok) {
    return sent.reason === 'not-configured'
      ? { ok: false, status: 503, error: 'Email codes are switched off right now. Upload your student ID instead — it takes a minute.', code: 'EMAIL_NOT_CONFIGURED' }
      : { ok: false, status: 502, error: 'We couldn’t send the code. Check the address and try again.' }
  }

  await ref.set({
    email,
    codeHash: hashCode(uid, email, code),
    expiresAt,
    attempts: 0,
    lastSentAt: new Date(now),
    sendsToday: sendsToday + 1,
    windowStart: inWindow ? data.windowStart : new Date(now),
    profile: {
      college: profile.college,
      graduationYear: profile.graduationYear,
      studyStatus: profile.studyStatus,
      afterGraduation: profile.afterGraduation ?? '',
    },
  })

  return { ok: true, cooldownSeconds: OTP_RULES.resendCooldownMs / 1000 }
}

export type ConfirmOtpResult =
  | { ok: true; expiresAt: string }
  | { ok: false; status: number; error: string }

export async function confirmEmailOtp(uid: string, code: string): Promise<ConfirmOtpResult> {
  const firestore = getAdminFirestore()
  const ref = firestore.collection(OTP_COLLECTION).doc(uid)
  const snap = await ref.get()
  if (!snap.exists) return { ok: false, status: 400, error: 'Request a code first.' }
  const data = snap.data() as Record<string, any>

  if ((data.expiresAt?.toMillis?.() ?? 0) < Date.now()) {
    return { ok: false, status: 400, error: 'That code has expired. Request a new one.' }
  }
  if ((data.attempts ?? 0) >= OTP_RULES.maxAttempts) {
    return { ok: false, status: 429, error: 'Too many wrong attempts. Request a new code.' }
  }

  const expected = Buffer.from(String(data.codeHash))
  const received = Buffer.from(hashCode(uid, data.email, code))
  const match = expected.length === received.length && timingSafeEqual(expected, received)
  if (!match) {
    await ref.update({ attempts: (data.attempts ?? 0) + 1 })
    const left = OTP_RULES.maxAttempts - (data.attempts ?? 0) - 1
    return { ok: false, status: 400, error: left > 0 ? `That code isn’t right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong attempts. Request a new code.' }
  }

  const profile = data.profile as VerificationProfile
  const expiresAt = await markVerified(uid, profile, 'email', {
    email: { address: data.email, verifiedAt: new Date() },
  })
  await ref.delete()
  return { ok: true, expiresAt: expiresAt.toISOString() }
}

// ── Student ID upload (staff review) ───────────────────────────────────────

export async function recordIdUpload(
  uid: string,
  upload: { storagePath: string; docType: IdDocType },
  profile: VerificationProfile
) {
  const { FieldValue } = await import('firebase-admin/firestore')
  const current = await getVerification(uid)
  const now = new Date()
  await getAdminFirestore()
    .collection(VERIFICATIONS_COLLECTION)
    .doc(uid)
    .set(
      {
        // An already-valid verification stays valid while the new ID is reviewed.
        status: current.status === 'verified' ? 'verified' : 'pending_review',
        college: profile.college,
        graduationYear: profile.graduationYear,
        studyStatus: profile.studyStatus,
        afterGraduation: profile.afterGraduation ?? '',
        id: {
          docType: upload.docType,
          storagePath: upload.storagePath,
          uploadedAt: now,
          reviewStatus: 'pending',
          reviewedAt: null,
          reviewedBy: '',
          reviewNote: '',
        },
        pendingReview: true,
        updatedAt: now,
        history: FieldValue.arrayUnion(historyEntry('id_uploaded', { docType: upload.docType })),
      },
      { merge: true }
    )
}

export async function reviewIdUpload(
  uid: string,
  decision: 'approved' | 'rejected',
  reviewer: string,
  note: string
): Promise<{ ok: true; expiresAt?: string } | { ok: false; error: string }> {
  const current = await getVerification(uid)
  if (!current.id) return { ok: false, error: 'No ID upload to review.' }
  const now = new Date()
  const idUpdate = {
    ...current.id,
    uploadedAt: new Date(current.id.uploadedAt),
    reviewStatus: decision,
    reviewedAt: now,
    reviewedBy: reviewer,
    reviewNote: note.slice(0, 300),
  }

  if (decision === 'approved') {
    if (!current.graduationYear) return { ok: false, error: 'This request has no graduation year.' }
    const expiresAt = await markVerified(
      uid,
      { college: current.college, graduationYear: current.graduationYear, studyStatus: current.studyStatus ?? 'studying', afterGraduation: current.afterGraduation },
      'id',
      { id: idUpdate, pendingReview: false }
    )
    await notifyReviewOutcome(uid, 'approved', expiresAt)
    return { ok: true, expiresAt: expiresAt.toISOString() }
  }

  const { FieldValue } = await import('firebase-admin/firestore')
  await getAdminFirestore()
    .collection(VERIFICATIONS_COLLECTION)
    .doc(uid)
    .set(
      {
        status: current.status === 'verified' ? 'verified' : 'rejected',
        id: idUpdate,
        pendingReview: false,
        updatedAt: now,
        history: FieldValue.arrayUnion(historyEntry('id_rejected', { reviewer, note: note.slice(0, 300) })),
      },
      { merge: true }
    )
  await notifyReviewOutcome(uid, 'rejected', null, note)
  return { ok: true }
}

async function notifyReviewOutcome(uid: string, decision: 'approved' | 'rejected', expiresAt: Date | null, note = '') {
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin')
    const user = await getAdminAuth().getUser(uid)
    if (!user.email) return
    await sendEmail(
      decision === 'approved'
        ? {
            to: user.email,
            subject: 'You’re verified — StudentVault is unlocked',
            text: `Your student ID was approved. Your StudentVault access is valid until ${formatAccessDate(expiresAt!)}. Open it at https://matrixo.in/studentvault/vault`,
            html: emailLayout(
              'You’re verified',
              `<p style="margin:0 0 16px">Your student ID was approved. Your claim links, guides and tracker are unlocked until <strong>${formatAccessDate(expiresAt!)}</strong>.</p>
<p style="margin:0"><a href="https://matrixo.in/studentvault/vault" style="display:inline-block;background:#0a6fd6;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">Open your vault</a></p>`
            ),
          }
        : {
            to: user.email,
            subject: 'We couldn’t verify your student ID',
            text: `We couldn't approve the document you uploaded${note ? `: ${note}` : '.'} You can upload a clearer one or verify with your college email at https://matrixo.in/studentvault/vault`,
            html: emailLayout(
              'We couldn’t verify your ID',
              `<p style="margin:0 0 12px">We couldn't approve the document you uploaded${note ? `: <em>${note.replace(/</g, '&lt;')}</em>` : '.'}</p>
<p style="margin:0">Upload a clearer photo, or verify with your college email instead — <a href="https://matrixo.in/studentvault/vault">try again</a>.</p>`
            ),
          }
    )
  } catch (error) {
    console.error('[StudentVault] could not email review outcome:', error)
  }
}

export async function listPendingIdReviews() {
  const snap = await getAdminFirestore()
    .collection(VERIFICATIONS_COLLECTION)
    .where('pendingReview', '==', true)
    .limit(100)
    .get()
  return snap.docs.map((d) => ({ uid: d.id, ...normalize(d.data() as Record<string, any>) }))
}
