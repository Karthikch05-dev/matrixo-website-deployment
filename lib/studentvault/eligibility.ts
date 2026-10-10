/**
 * StudentVault eligibility — the ONE place these rules live.
 *
 * A student is eligible while they are studying. Their access runs until the
 * end of their graduation year (e.g. a 2022–2026 B.Tech keeps access until
 * 31 Dec 2026), and they must re-confirm they are still a student at least
 * every `reverifyEveryMonths`. After the graduation year ends, verification
 * and access both expire.
 *
 * Change the policy here and every page, API and email follows.
 */
export const ELIGIBILITY = {
  /** Access ends on this month/day (1-based month) of the graduation year, IST. */
  accessEndsOn: { month: 12, day: 31 },
  /** Ask the student to re-confirm their status at least this often. */
  reverifyEveryMonths: 12,
  /** Start nudging this many days before access ends. */
  reverifyWarningDays: 30,
  /** Longest programme we accept, used to bound the graduation-year input. */
  maxProgramYears: 6,
} as const

/** End of access for a given graduation year, as a UTC instant (23:59:59 IST). */
export function accessEndForGraduationYear(graduationYear: number): Date {
  const { month, day } = ELIGIBILITY.accessEndsOn
  // 23:59:59 IST == 18:29:59 UTC the same day.
  return new Date(Date.UTC(graduationYear, month - 1, day, 18, 29, 59))
}

/** Graduation years a currently enrolled student can pick right now. */
export function selectableGraduationYears(now: Date = new Date()): number[] {
  const first = graduationYearFloor(now)
  return Array.from({ length: ELIGIBILITY.maxProgramYears + 1 }, (_, i) => first + i)
}

/** The earliest graduation year that still has access today. */
export function graduationYearFloor(now: Date = new Date()): number {
  const thisYear = Number(
    new Intl.DateTimeFormat('en-IN', { year: 'numeric', timeZone: 'Asia/Kolkata' }).format(now)
  )
  return accessEndForGraduationYear(thisYear).getTime() >= now.getTime() ? thisYear : thisYear + 1
}

export function isGraduationYearEligible(graduationYear: number, now: Date = new Date()): boolean {
  if (!Number.isInteger(graduationYear)) return false
  const floor = graduationYearFloor(now)
  return graduationYear >= floor && graduationYear <= floor + ELIGIBILITY.maxProgramYears
}

/**
 * When a verification done `verifiedAt` stops being valid: the earlier of the
 * graduation-year cutoff and the periodic re-verification date.
 */
export function verificationExpiry(graduationYear: number, verifiedAt: Date): Date {
  const cutoff = accessEndForGraduationYear(graduationYear)
  const periodic = new Date(verifiedAt)
  periodic.setUTCMonth(periodic.getUTCMonth() + ELIGIBILITY.reverifyEveryMonths)
  return cutoff.getTime() < periodic.getTime() ? cutoff : periodic
}

export function daysLeft(expiresAt: Date | string | null | undefined, now: Date = new Date()): number | null {
  if (!expiresAt) return null
  const t = new Date(expiresAt).getTime()
  if (Number.isNaN(t)) return null
  return Math.ceil((t - now.getTime()) / 86_400_000)
}

export function formatAccessDate(value: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value))
}
