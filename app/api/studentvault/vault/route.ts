import { NextRequest, NextResponse } from 'next/server'
import { getClaims } from '@/lib/studentvault/data'
import { requireUnlocked } from '@/lib/studentvault/verifyInput'
import { NINETY_MINUTE_SPRINT, VERIFICATION_PLAYBOOK } from '@/lib/studentvault/playbook'

export const dynamic = 'force-dynamic'

/**
 * Vault payload for buyers who are verified students. Everyone else gets only
 * a reason ("pay" or "verify") and their access state.
 */
export async function GET(request: NextRequest) {
  try {
    const gate = await requireUnlocked(request)
    if (!gate.ok) return gate.response

    const claims = await getClaims(gate.user.uid)

    return NextResponse.json({
      playbook: VERIFICATION_PLAYBOOK,
      sprint: NINETY_MINUTE_SPRINT,
      claims,
      access: gate.access,
    })
  } catch (error) {
    console.error('[StudentVault] vault read failed:', error)
    return NextResponse.json({ error: 'Could not load your vault.' }, { status: 500 })
  }
}
