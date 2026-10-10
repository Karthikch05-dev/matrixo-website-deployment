import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { requireUnlocked } from '@/lib/studentvault/verifyInput'
import { clampText } from '@/lib/security/sanitize'
import { getOwnTestimonial, saveTestimonial, TESTIMONIAL_RULES } from '@/lib/studentvault/testimonials'

export const dynamic = 'force-dynamic'

/** The caller's own testimonial, if they have written one. */
export async function GET(request: NextRequest) {
  const user = await getAuthedUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const testimonial = await getOwnTestimonial(user.uid).catch(() => null)
  return NextResponse.json({ testimonial })
}

/**
 * Verified buyers share a short testimonial. It appears on the StudentVault
 * page straight away; staff can hide it from the console.
 */
export async function POST(request: NextRequest) {
  const gate = await requireUnlocked(request)
  if (!gate.ok) return gate.response

  const body = await request.json().catch(() => null)
  const quote = clampText(body?.quote, TESTIMONIAL_RULES.maxLength).replace(/\s+/g, ' ').trim()
  const name = clampText(body?.name, 60).trim() || gate.user.name || 'StudentVault member'
  const showCollege = body?.showCollege !== false
  const rating = Math.min(5, Math.max(1, Math.round(Number(body?.rating) || 5)))

  if (quote.length < TESTIMONIAL_RULES.minLength) {
    return NextResponse.json(
      { error: `Write at least ${TESTIMONIAL_RULES.minLength} characters.` },
      { status: 400 }
    )
  }

  try {
    await saveTestimonial(gate.user.uid, {
      name,
      college: showCollege ? gate.access.verification.college : '',
      quote,
      rating,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[StudentVault] testimonial save failed:', error)
    return NextResponse.json({ error: 'Could not save your testimonial.' }, { status: 500 })
  }
}
