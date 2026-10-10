import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { recordGraduated } from '@/lib/studentvault/verification'
import { getStudentVaultAccess } from '@/lib/studentvault/access'

export const dynamic = 'force-dynamic'

/**
 * Re-verification answer "I've graduated". Access then runs until the end of
 * the graduation year and stops. ("Still studying" / "changed college"
 * re-verify through the email or ID routes instead.)
 */
export async function POST(request: NextRequest) {
  const user = await getAuthedUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const graduationYear = Number(body?.graduationYear)
  const afterGraduation = typeof body?.afterGraduation === 'string' ? body.afterGraduation.trim() : ''
  const thisYear = new Date().getFullYear()
  if (!Number.isInteger(graduationYear) || graduationYear < thisYear - 10 || graduationYear > thisYear + 1) {
    return NextResponse.json({ error: 'Pick the year you graduated.' }, { status: 400 })
  }

  try {
    await recordGraduated(user.uid, graduationYear, afterGraduation)
    const access = await getStudentVaultAccess(user.uid)
    return NextResponse.json({ success: true, access })
  } catch (error) {
    console.error('[StudentVault] status update failed:', error)
    return NextResponse.json({ error: 'Could not save your answer.' }, { status: 500 })
  }
}
