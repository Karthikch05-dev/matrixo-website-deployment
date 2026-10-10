import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { getStudentVaultAccess } from '@/lib/studentvault/access'
import { getLivePrice } from '@/lib/studentvault/pricing'

export const dynamic = 'force-dynamic'

/** The signed-in user's pass + verification state, and the live price. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser(request)
    const [access, price] = await Promise.all([
      user ? getStudentVaultAccess(user.uid) : Promise.resolve(null),
      getLivePrice(),
    ])
    return NextResponse.json(
      { signedIn: Boolean(user), access, price },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  } catch (error) {
    console.error('[StudentVault] access read failed:', error)
    return NextResponse.json({ error: 'Could not load your access.' }, { status: 500 })
  }
}
