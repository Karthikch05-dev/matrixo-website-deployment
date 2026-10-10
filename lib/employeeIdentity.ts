import { NextRequest } from 'next/server'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'

/**
 * EMPLOYEE IDENTITY RESOLUTION (server-side)
 * ============================================================================
 * The `Employees` collection has MIXED document IDs. Some documents are keyed
 * by the user's Firebase Auth UID; others were created manually and are keyed
 * by the employee's name. Both are valid and neither may be renamed.
 *
 * Firestore *security rules* cannot run queries — only get()/exists() on a
 * known path — so a rule can never "find the doc where email == token email".
 * Identity therefore has to be resolved where queries ARE possible: server
 * side, with the Admin SDK (which bypasses rules).
 *
 * This mirrors the resolution already used by
 * `app/api/event-visibility/route.ts` and `lib/studentvault/auth.ts`, and is
 * factored out here so Project Work does not become a fourth copy.
 *
 * The resolved role is also mirrored onto a custom auth claim, which is what
 * lets Firestore rules recognise a manager without reading `Employees` at all.
 */

export const MANAGER_ROLES = ['admin', 'sub-admin'] as const

/** The claim rules read. Namespaced so it cannot collide with reserved claims. */
export const ROLE_CLAIM = 'portalRole'

export interface ResolvedEmployee {
  /** Firebase Auth UID — the stable identity. Always present. */
  uid: string
  email: string | null
  /** Name from the Employees record, falling back to the token. */
  name: string
  /** The `employeeId` FIELD (e.g. "EMP001"), not the document ID. */
  employeeId: string | null
  /** The Firestore document ID, which may be a UID *or* a name. */
  employeeDocId: string
  role: string | null
  department: string | null
  /** How the record was found — surfaced for debugging. */
  resolvedBy: 'uid' | 'email'
}

export type IdentityResult =
  | { ok: true; employee: ResolvedEmployee }
  | { ok: false; status: 401 | 403 | 409; error: string; code: string }

export const isManagerRole = (role?: string | null): boolean =>
  role === 'admin' || role === 'sub-admin'

function readBearerToken(request: NextRequest): string | null {
  const header =
    request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

/**
 * Development-only tracing. Logs *which* document was resolved and how, without
 * printing the record's contents. Enable with PROJECT_WORK_DEBUG=1.
 */
function trace(message: string, detail: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === 'production' && process.env.PROJECT_WORK_DEBUG !== '1') return
  console.log(`[employeeIdentity] ${message}`, detail)
}

/**
 * Resolve the caller's employee record from a verified ID token.
 *
 * Order:
 *   1. Employees/{uid}                  — the modern, uid-keyed shape
 *   2. where('email','==',token.email)  — legacy name-keyed documents
 *
 * Email is used for the fallback (never name), because names are not unique
 * and the token's email is verified and cannot be forged by the client.
 */
export async function resolveEmployee(request: NextRequest): Promise<IdentityResult> {
  const token = readBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, error: 'Sign in required.', code: 'NO_TOKEN' }
  }

  let decoded
  try {
    decoded = await getAdminAuth().verifyIdToken(token)
  } catch {
    return { ok: false, status: 401, error: 'Your session has expired. Sign in again.', code: 'BAD_TOKEN' }
  }

  const uid = decoded.uid
  const email = decoded.email ?? null
  const firestore = getAdminFirestore()

  // --- 1. uid-keyed --------------------------------------------------------
  const byUid = await firestore.collection('Employees').doc(uid).get()
  if (byUid.exists) {
    const data = byUid.data() as Record<string, any>
    trace('resolved by uid', { uid, docId: byUid.id, role: data.role })
    return {
      ok: true,
      employee: {
        uid,
        email,
        name: data.name ?? (decoded.name as string | undefined) ?? 'Unknown',
        employeeId: data.employeeId ?? null,
        employeeDocId: byUid.id,
        role: data.role ?? null,
        department: data.department ?? null,
        resolvedBy: 'uid',
      },
    }
  }

  // --- 2. email fallback for legacy name-keyed documents -------------------
  if (!email) {
    return {
      ok: false, status: 403,
      error: 'No employee record could be matched to this account.',
      code: 'NO_EMAIL_NO_DOC',
    }
  }

  // limit(2), not limit(1): two records sharing an email means the identity is
  // ambiguous, and silently taking docs[0] could grant someone else's role.
  const matches = await firestore
    .collection('Employees')
    .where('email', '==', email)
    .limit(2)
    .get()

  if (matches.empty) {
    trace('no employee record', { uid, email })
    return {
      ok: false, status: 403,
      error: 'No employee record is linked to this account. Contact an administrator.',
      code: 'NO_EMPLOYEE_RECORD',
    }
  }

  if (matches.size > 1) {
    // Fail closed rather than guess — see requirement "do not silently assign
    // a wrong employee record".
    trace('AMBIGUOUS: multiple employees share this email', {
      uid, email, docIds: matches.docs.map((d) => d.id),
    })
    return {
      ok: false, status: 409,
      error:
        'More than one employee record uses this email address, so your identity ' +
        'cannot be confirmed. Contact an administrator.',
      code: 'AMBIGUOUS_EMAIL',
    }
  }

  const doc = matches.docs[0]
  const data = doc.data() as Record<string, any>
  trace('resolved by email fallback', { uid, docId: doc.id, role: data.role })

  return {
    ok: true,
    employee: {
      uid,
      email,
      name: data.name ?? (decoded.name as string | undefined) ?? 'Unknown',
      employeeId: data.employeeId ?? null,
      employeeDocId: doc.id,
      role: data.role ?? null,
      department: data.department ?? null,
      resolvedBy: 'email',
    },
  }
}

/** Resolve, and additionally require Admin / Co-Admin. */
export async function requireManager(request: NextRequest): Promise<IdentityResult> {
  const result = await resolveEmployee(request)
  if (!result.ok) return result
  if (!isManagerRole(result.employee.role)) {
    return {
      ok: false, status: 403,
      error: 'Only an Admin or Co-Admin can do that.',
      code: 'NOT_MANAGER',
    }
  }
  return result
}

/**
 * Mirror the resolved role onto a custom auth claim.
 *
 * This is what makes Firestore rules work for BOTH document shapes: a rule can
 * read `request.auth.token.portalRole` without knowing whether the employee's
 * document is keyed by uid or by name. Claims are settable only via the Admin
 * SDK, so a client can never grant itself a role.
 *
 * Returns true when the claim changed (the client then needs a token refresh).
 */
export async function syncRoleClaim(employee: ResolvedEmployee): Promise<boolean> {
  const auth = getAdminAuth()
  const desired = isManagerRole(employee.role) ? employee.role : 'employee'

  try {
    const user = await auth.getUser(employee.uid)
    const current = (user.customClaims || {})[ROLE_CLAIM]
    if (current === desired) return false

    await auth.setCustomUserClaims(employee.uid, {
      ...(user.customClaims || {}),
      [ROLE_CLAIM]: desired,
    })
    trace('role claim updated', { uid: employee.uid, from: current, to: desired })
    return true
  } catch (err) {
    // A claim-sync failure must not block the request: rules fall back to
    // owner-by-uid checks, which still work. Managers would lose elevated
    // reads until the next successful sync, which is the safe direction.
    console.error('[employeeIdentity] could not sync role claim:', err)
    return false
  }
}
