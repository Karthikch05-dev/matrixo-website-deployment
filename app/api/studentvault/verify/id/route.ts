import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUser } from '@/lib/studentvault/auth'
import { parseVerificationProfile } from '@/lib/studentvault/verifyInput'
import { recordIdUpload, type IdDocType } from '@/lib/studentvault/verification'
import { getStudentVaultAccess } from '@/lib/studentvault/access'
import { ID_UPLOAD_RULES, saveIdUpload } from '@/lib/studentvault/idStorage'
import { clientKey, rateLimit } from '@/lib/security/rateLimit'

export const dynamic = 'force-dynamic'

const DOC_TYPES: IdDocType[] = ['student_id', 'bonafide', 'fee_receipt', 'admission_letter']

/** Multipart upload of a student ID (or bonafide / fee receipt) for staff review. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`sv-id-upload:${clientKey(request)}`, 6, 60 * 60 * 1000)
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 })
  }

  const user = await getAuthedUser(request)
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Upload a photo or PDF of your document.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: 'Upload a photo or PDF of your document.' }, { status: 400 })
  }
  if (file.size > ID_UPLOAD_RULES.maxBytes) {
    return NextResponse.json({ error: 'That file is over 4 MB. Try a smaller photo.' }, { status: 413 })
  }
  if (!ID_UPLOAD_RULES.types[file.type]) {
    return NextResponse.json({ error: 'Use a JPG, PNG, WebP or PDF.' }, { status: 415 })
  }

  const rawDocType = String(form.get('docType') ?? '') as IdDocType
  const docType: IdDocType = DOC_TYPES.includes(rawDocType) ? rawDocType : 'student_id'
  const parsed = parseVerificationProfile({
    college: form.get('college'),
    graduationYear: form.get('graduationYear'),
    studyStatus: form.get('studyStatus'),
  })
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const storagePath = await saveIdUpload(user.uid, Buffer.from(await file.arrayBuffer()), file.type)
    await recordIdUpload(user.uid, { storagePath, docType }, parsed.profile)
    const access = await getStudentVaultAccess(user.uid)
    return NextResponse.json({ success: true, access })
  } catch (error) {
    console.error('[StudentVault] ID upload failed:', error)
    return NextResponse.json({ error: 'Could not upload your document. Try again.' }, { status: 500 })
  }
}
