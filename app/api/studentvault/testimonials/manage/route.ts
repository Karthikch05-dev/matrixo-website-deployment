import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee } from '@/lib/studentvault/auth'
import { listAllTestimonials, setTestimonialHidden } from '@/lib/studentvault/testimonials'

export const dynamic = 'force-dynamic'

/** Staff: every testimonial, including hidden ones. */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  try {
    return NextResponse.json({ items: await listAllTestimonials() })
  } catch (error) {
    console.error('[StudentVault] list testimonials failed:', error)
    return NextResponse.json({ error: 'Could not load testimonials.' }, { status: 500 })
  }
}

/** Staff: hide or show one. body: { uid, hidden } */
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null)
  const uid = typeof body?.uid === 'string' ? body.uid : ''
  if (!uid || typeof body?.hidden !== 'boolean') {
    return NextResponse.json({ error: 'uid and hidden are required.' }, { status: 400 })
  }
  try {
    await setTestimonialHidden(uid, body.hidden, auth.employee.name || auth.employee.email || 'staff')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[StudentVault] testimonial moderation failed:', error)
    return NextResponse.json({ error: 'Could not update.' }, { status: 500 })
  }
}
