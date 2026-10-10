import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee } from '@/lib/studentvault/auth'
import { listPendingIdReviews, reviewIdUpload } from '@/lib/studentvault/verification'
import { signedIdUrl } from '@/lib/studentvault/idStorage'

export const dynamic = 'force-dynamic'

/** Staff: pending student-ID reviews, each with a 15-minute signed link. */
export async function GET(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const pending = await listPendingIdReviews()
    const items = await Promise.all(
      pending.map(async (p) => ({
        uid: p.uid,
        college: p.college,
        graduationYear: p.graduationYear,
        studyStatus: p.studyStatus,
        status: p.status,
        docType: p.id?.docType ?? 'student_id',
        uploadedAt: p.id?.uploadedAt ?? null,
        fileUrl: p.id?.storagePath ? await signedIdUrl(p.id.storagePath) : null,
        isPdf: Boolean(p.id?.storagePath?.endsWith('.pdf')),
      }))
    )
    items.sort((a, b) => (a.uploadedAt ?? '').localeCompare(b.uploadedAt ?? ''))
    return NextResponse.json({ items })
  } catch (error) {
    console.error('[StudentVault] list reviews failed:', error)
    return NextResponse.json({ error: 'Could not load reviews.' }, { status: 500 })
  }
}

/** Staff: approve or reject one upload. body: { uid, decision, note? } */
export async function POST(request: NextRequest) {
  const auth = await requireEmployee(request)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => null)
  const uid = typeof body?.uid === 'string' ? body.uid : ''
  const decision = body?.decision === 'approved' || body?.decision === 'rejected' ? body.decision : null
  const note = typeof body?.note === 'string' ? body.note.trim() : ''
  if (!uid || !decision) return NextResponse.json({ error: 'uid and decision are required.' }, { status: 400 })
  if (decision === 'rejected' && !note) {
    return NextResponse.json({ error: 'Add a short reason so the student knows what to fix.' }, { status: 400 })
  }

  try {
    const reviewer = auth.employee.name || auth.employee.email || 'matriXO team'
    const result = await reviewIdUpload(uid, decision, reviewer, note)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[StudentVault] review failed:', error)
    return NextResponse.json({ error: 'Could not save the review.' }, { status: 500 })
  }
}
