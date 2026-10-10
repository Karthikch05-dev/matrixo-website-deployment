import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { VERIFICATIONS_COLLECTION } from '@/lib/studentvault/verification'
import { deleteIdUpload } from '@/lib/studentvault/idStorage'

export const dynamic = 'force-dynamic'

const RETENTION_DAYS = 90

/**
 * Daily (Vercel Cron, see vercel.json): deletes student ID documents 90 days
 * after they were reviewed, as promised in the privacy policy. The review
 * outcome itself is kept; only the file goes.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000)
  const snap = await getAdminFirestore()
    .collection(VERIFICATIONS_COLLECTION)
    .where('id.reviewedAt', '<', cutoff)
    .limit(200)
    .get()

  let deleted = 0
  for (const doc of snap.docs) {
    const path = doc.data()?.id?.storagePath
    if (typeof path !== 'string' || !path) continue
    try {
      await deleteIdUpload(path)
      await doc.ref.update({ 'id.storagePath': FieldValue.delete(), 'id.fileDeletedAt': new Date() })
      deleted += 1
    } catch (error) {
      console.error('[StudentVault] could not delete ID upload:', error)
    }
  }

  return NextResponse.json({ ok: true, deleted })
}
