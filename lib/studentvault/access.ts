// Server-only: the single answer to "can this user see the vault?"
import { getEntitlement } from './data'
import { getVerification, publicVerification, type VerificationRecord } from './verification'
import { daysLeft, ELIGIBILITY } from './eligibility'

export interface StudentVaultAccess {
  paid: boolean
  purchasedAt: string | null
  amountPaid: number
  verification: ReturnType<typeof publicVerification>
  /** Paid AND currently verified as a student. */
  unlocked: boolean
  /** Verified but inside the warning window, or expired: ask to re-verify. */
  reverifyDue: boolean
}

export function accessFrom(
  entitlement: Awaited<ReturnType<typeof getEntitlement>>,
  verification: VerificationRecord
): StudentVaultAccess {
  const paid = entitlement?.active === true
  const verified = verification.status === 'verified'
  const left = daysLeft(verification.expiresAt)
  return {
    paid,
    purchasedAt: entitlement?.grantedAt || null,
    amountPaid: entitlement?.amountPaid ?? 0,
    verification: publicVerification(verification),
    unlocked: paid && verified,
    reverifyDue:
      verification.status === 'expired' ||
      (verified && left !== null && left <= ELIGIBILITY.reverifyWarningDays),
  }
}

export async function getStudentVaultAccess(uid: string): Promise<StudentVaultAccess> {
  const [entitlement, verification] = await Promise.all([getEntitlement(uid), getVerification(uid)])
  return accessFrom(entitlement, verification)
}
