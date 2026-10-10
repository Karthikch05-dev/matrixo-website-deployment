import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { confirmEmailOtp } from '@/lib/studentvault/verification'
import { getStudentVaultAccess } from '@/lib/studentvault/access'
import { clientKey, rateLimit } from '@/lib/security/rateLimit'

export const dynamic = 'force-dynamic'

/** Checks the 6-digit code; on success the student is verified. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`sv-otp-confirm:${clientKey(request)}`, 20, 10 * 60 * 1000)
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
    )
  }

  const user = await getAuthedUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const code = typeof body?.code === 'string' ? body.code.replace(/\D/g, '') : ''
  if (code.length !== 6) return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 })

  try {
    const result = await confirmEmailOtp(user.uid, code)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
    const access = await getStudentVaultAccess(user.uid)
    return NextResponse.json({ success: true, expiresAt: result.expiresAt, access })
  } catch (error) {
    console.error('[StudentVault] OTP confirm failed:', error)
    return NextResponse.json({ error: 'Could not check the code. Try again.' }, { status: 500 })
  }
}
