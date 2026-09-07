import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { getClaims, hasStudentVaultAccess } from '@/lib/studentvault/data'
import { NINETY_MINUTE_SPRINT, VERIFICATION_PLAYBOOK } from '@/lib/studentvault/playbook'

export const dynamic = 'force-dynamic'

/** Entitlement-gated vault payload. Unpaid callers receive nothing but a flag. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    }

    if (!(await hasStudentVaultAccess(user.uid))) {
      return NextResponse.json(
        { error: 'StudentVault access required.', locked: true },
        { status: 403 }
      )
    }

    const claims = await getClaims(user.uid)

    return NextResponse.json({
      playbook: VERIFICATION_PLAYBOOK,
      sprint: NINETY_MINUTE_SPRINT,
      claims,
    })
  } catch (error) {
    console.error('[StudentVault] vault read failed:', error)
    return NextResponse.json({ error: 'Could not load your vault.' }, { status: 500 })
  }
}
