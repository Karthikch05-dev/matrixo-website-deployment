// Server-only: shared request parsing and gating for the verification APIs.
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser, type AuthedUser } from './auth'
import { getStudentVaultAccess, type StudentVaultAccess } from './access'
import { isGraduationYearEligible, accessEndForGraduationYear, formatAccessDate, graduationYearFloor } from './eligibility'
import type { StudyStatus, VerificationProfile } from './verification'

const STUDY_STATUSES: StudyStatus[] = ['studying', 'changed_college', 'graduated']

export type ProfileParse = { ok: true; profile: VerificationProfile } | { ok: false; error: string }

/** Validates the "who are you" answers sent with every verification attempt. */
export function parseVerificationProfile(raw: Record<string, unknown> | null | undefined): ProfileParse {
  const college = typeof raw?.college === 'string' ? raw.college.trim().slice(0, 160) : ''
  const graduationYear = Number(raw?.graduationYear)
  const studyStatus = (STUDY_STATUSES as string[]).includes(String(raw?.studyStatus))
    ? (raw!.studyStatus as StudyStatus)
    : 'studying'
  const afterGraduation = typeof raw?.afterGraduation === 'string' ? raw.afterGraduation.trim().slice(0, 200) : ''

  if (!college) return { ok: false, error: 'Tell us your college.' }
  if (!Number.isInteger(graduationYear)) return { ok: false, error: 'Pick your graduation year.' }
  if (!isGraduationYearEligible(graduationYear)) {
    const ended = graduationYear < graduationYearFloor()
    return {
      ok: false,
      error: ended
        ? `Student access for the ${graduationYear} batch ended on ${formatAccessDate(accessEndForGraduationYear(graduationYear))}.`
        : 'That graduation year is too far away — check it and try again.',
    }
  }
  return { ok: true, profile: { college, graduationYear, studyStatus, afterGraduation } }
}

export type GateResult =
  | { ok: true; user: AuthedUser; access: StudentVaultAccess }
  | { ok: false; response: NextResponse }

/** Paid AND verified. Unpaid or unverified callers get a reason, never data. */
export async function requireUnlocked(request: NextRequest): Promise<GateResult> {
  const user = await getAuthedUser(request)
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }) }
  }
  const access = await getStudentVaultAccess(user.uid)
  if (!access.unlocked) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: access.paid ? 'Verify that you’re a student to unlock this.' : 'StudentVault access required.',
          locked: true,
          reason: access.paid ? 'verify' : 'pay',
          access,
        },
        { status: 403 }
      ),
    }
  }
  return { ok: true, user, access }
}
