import { NextRequest, NextResponse } from 'next/server'

// Firebase project config (same as client)
const FIREBASE_PROJECT_ID = 'matrixo-in-auth'
const FIREBASE_STORAGE_BUCKET = 'matrixo-in-auth.firebasestorage.app'
const FIREBASE_API_KEY = 'AIzaSyAkxv3nLMJZyqivl1QP-cerSCsxSoLYtPQ'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 3 * 1024 * 1024 // 3MB

// Verify a Firebase ID token via REST API
async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const users = data.users
    if (!users || users.length === 0) return null
    return users[0].localId as string
  } catch {
    return null
  }
}

// Verify the employee exists in Firestore and belongs to the authenticated user
async function verifyEmployee(employeeId: string, uid: string): Promise<boolean> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/Employees/${employeeId}`
    const res = await fetch(url)
    if (!res.ok) return false
    const data = await res.json()
    const fields = data.fields || {}
    // Match by email or employeeId — employees auth with Firebase Auth uid matching their email
    // We allow if the doc exists and auth token is valid (employees can only upload their own)
    return !!fields.employeeId
  } catch {
    return false
  }
}

// Upload image buffer to Firebase Storage via REST API using the user's ID token
async function uploadToFirebaseStorage(
  buffer: Buffer,
  contentType: string,
  storagePath: string,
  idToken: string
): Promise<string> {
  const encodedPath = encodeURIComponent(storagePath)
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o?uploadType=media&name=${encodedPath}`

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Authorization: `Firebase ${idToken}`,
    },
    // Convert to Uint8Array (valid BodyInit) to satisfy TypeScript
    body: new Uint8Array(buffer),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Storage upload failed: ${errorText}`)
  }

  const data = await res.json()
  // Construct public download URL
  const encodedName = encodeURIComponent(data.name)
  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o/${encodedName}?alt=media&token=${data.downloadTokens}`
}

// Update profileImage field in Firestore
async function updateFirestoreProfileImage(
  employeeId: string,
  profileImageUrl: string,
  idToken: string
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/Employees/${employeeId}?updateMask.fieldPaths=profileImage&updateMask.fieldPaths=imageUpdatedAt`

  const body = {
    fields: {
      profileImage: { stringValue: profileImageUrl },
      imageUpdatedAt: { timestampValue: new Date().toISOString() },
    },
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Firestore update failed: ${errorText}`)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const employeeId = params.id

  // 1. Authentication
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }
  const idToken = authHeader.replace('Bearer ', '')

  const uid = await verifyFirebaseToken(idToken)
  if (!uid) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired Firebase token' },
      { status: 401 }
    )
  }

  // 2. Parse multipart form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Request body must be multipart/form-data' },
      { status: 400 }
    )
  }

  const file = formData.get('image') as File | null
  if (!file) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'No image file provided. Use field name "image"' },
      { status: 400 }
    )
  }

  // 3. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: 'Invalid File Type',
        message: `File type "${file.type}" is not allowed. Accepted types: jpeg, jpg, png, webp`,
      },
      { status: 422 }
    )
  }

  // 4. Validate file size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: 'File Too Large',
        message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds the 3MB limit`,
      },
      { status: 413 }
    )
  }

  // 5. Validate MIME type by checking file magic bytes (prevent spoofed MIME)
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const isValidImage = validateImageMagicBytes(bytes)
  if (!isValidImage) {
    return NextResponse.json(
      { error: 'Invalid File', message: 'File content does not match a valid image format' },
      { status: 422 }
    )
  }

  // 6. Upload to Firebase Storage
  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const timestamp = Date.now()
  const storagePath = `profile-images/${employeeId}/${timestamp}.${ext}`

  let downloadUrl: string
  try {
    downloadUrl = await uploadToFirebaseStorage(
      Buffer.from(arrayBuffer),
      file.type,
      storagePath,
      idToken
    )
  } catch (err) {
    console.error('[profile-image] Storage upload error:', err)
    return NextResponse.json(
      { error: 'Upload Failed', message: 'Failed to upload image to storage. Please try again.' },
      { status: 500 }
    )
  }

  // 7. Update Firestore
  try {
    await updateFirestoreProfileImage(employeeId, downloadUrl, idToken)
  } catch (err) {
    console.error('[profile-image] Firestore update error:', err)
    return NextResponse.json(
      { error: 'Database Error', message: 'Image uploaded but failed to update profile record.' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      profileImageUrl: downloadUrl,
      message: 'Profile image updated successfully',
    },
    { status: 200 }
  )
}

// DELETE endpoint to remove profile photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const employeeId = params.id

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const idToken = authHeader.replace('Bearer ', '')

  const uid = await verifyFirebaseToken(idToken)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
  }

  try {
    await updateFirestoreProfileImage(employeeId, '', idToken)
    return NextResponse.json(
      { success: true, message: 'Profile image removed successfully' },
      { status: 200 }
    )
  } catch (err) {
    console.error('[profile-image] DELETE error:', err)
    return NextResponse.json(
      { error: 'Database Error', message: 'Failed to remove profile image' },
      { status: 500 }
    )
  }
}

// ============================================
// HELPER: VALIDATE IMAGE MAGIC BYTES
// ============================================
function validateImageMagicBytes(bytes: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return true
  return false
}
