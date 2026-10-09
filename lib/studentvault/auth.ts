import { NextRequest } from 'next/server'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'

export interface AuthedUser {
  uid: string
  email: string | null
  name: string | null
}

export interface AuthedEmployee extends AuthedUser {
  employeeId: string | null
  role: string | null
}

function readBearerToken(request: NextRequest): string | null {
  const header =
    request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

/** Verifies the caller's Firebase ID token. Returns null when absent or invalid. */
export async function getAuthedUser(request: NextRequest): Promise<AuthedUser | null> {
  const token = readBearerToken(request)
  if (!token) return null

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
    }
  } catch {
    return null
  }
}

/**
 * The `Employees` collection is writable by any authenticated user under the
 * current Firestore rules, so the presence of an employee document alone is not
 * proof of employment — a student could create one for their own uid. We
 * therefore also require the email on the *verified ID token* (which cannot be
 * forged) to match a matriXO company address.
 */
const DEFAULT_EMPLOYEE_EMAIL_PATTERN = /(@matrixo\.in|\.matrixo@gmail\.com)$/i

/**
 * Explicit allowlist for employees whose sign-in address is not a company
 * address (comma-separated). Set server-side only, so it cannot be self-granted.
 */
function allowlistedEmails(): string[] {
  return (process.env.STUDENTVAULT_EMPLOYEE_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

function isCompanyEmail(email: string | null): boolean {
  if (!email) return false

  if (allowlistedEmails().includes(email.toLowerCase())) return true

  const configured = process.env.STUDENTVAULT_EMPLOYEE_EMAIL_PATTERN
  if (configured) {
    try {
      return new RegExp(configured, 'i').test(email)
    } catch {
      return DEFAULT_EMPLOYEE_EMAIL_PATTERN.test(email)
    }
  }
  return DEFAULT_EMPLOYEE_EMAIL_PATTERN.test(email)
}

export type EmployeeAuthResult =
  | { ok: true; employee: AuthedEmployee }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Authorizes a StudentVault management request. Both conditions must hold:
 *   1. an Employees record exists for the caller, and
 *   2. the verified token email is a matriXO company address.
 */
export async function requireEmployee(
  request: NextRequest
): Promise<EmployeeAuthResult> {
  const user = await getAuthedUser(request)
  if (!user) {
    return { ok: false, status: 401, error: 'Sign in required.' }
  }

  if (!isCompanyEmail(user.email)) {
    return { ok: false, status: 403, error: 'Not authorized to manage StudentVault.' }
  }

  const firestore = getAdminFirestore()
  let snap = await firestore.collection('Employees').doc(user.uid).get()

  if (!snap.exists && user.email) {
    // Some employee documents predate uid-keying and are only findable by email.
    const query = await firestore
      .collection('Employees')
      .where('email', '==', user.email)
      .limit(1)
      .get()
    if (!query.empty) snap = query.docs[0]
  }

  if (!snap.exists) {
    return { ok: false, status: 403, error: 'Not authorized to manage StudentVault.' }
  }

  const data = snap.data() as { employeeId?: string; role?: string; name?: string }

  return {
    ok: true,
    employee: {
      ...user,
      name: data.name ?? user.name,
      employeeId: data.employeeId ?? null,
      role: data.role ?? null,
    },
  }
}

export function isAdmin(employee: AuthedEmployee): boolean {
  return employee.role === 'admin' || employee.role === 'sub-admin'
}
