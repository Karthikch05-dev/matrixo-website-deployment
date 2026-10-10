import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { checkCollegeEmail } from '@/lib/studentvault/emailDomains'
import { parseVerificationProfile } from '@/lib/studentvault/verifyInput'
import { sendEmailOtp } from '@/lib/studentvault/verification'
import { clientKey, rateLimit } from '@/lib/security/rateLimit'

export const dynamic = 'force-dynamic'

/** Sends a 6-digit code to the student's college email. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`sv-otp-send:${clientKey(request)}`, 10, 10 * 60 * 1000)
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a few minutes.', retryAfter: limited.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
    )
  }

  const user = await getAuthedUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const check = checkCollegeEmail(email)
  if (!check.ok) return NextResponse.json({ error: check.reason, field: 'email' }, { status: 400 })

  const parsed = parseVerificationProfile(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const result = await sendEmailOtp(user.uid, email, parsed.profile)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, retryAfter: result.retryAfter, code: result.code },
        { status: result.status }
      )
    }
    return NextResponse.json({ success: true, cooldownSeconds: result.cooldownSeconds })
  } catch (error) {
    console.error('[StudentVault] OTP send failed:', error)
    return NextResponse.json({ error: 'Could not send the code. Try again.' }, { status: 500 })
  }
}
