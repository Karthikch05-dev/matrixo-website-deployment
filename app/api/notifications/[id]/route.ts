import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'
import { requireEmployee } from '@/lib/studentvault/auth'
import { PUBLIC_NOTIFICATIONS_COLLECTION } from '@/lib/publicNotifications'

export const dynamic = 'force-dynamic'

/**
 * DELETE — Permanently remove a public notification.
 *
 * Security Requirement: Notification deletion permissions must NOT be controlled 
 * only by frontend visibility. The backend verifies that the authenticated user 
 * is a Matrixo Employee (admin/sub-admin) before deleting the notification from Firestore.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── 1. Backend Security / Authorization ──────────────────────────────
  const auth = await requireEmployee(request)
  if (!auth.ok) {
    return NextResponse.json(
      { error: 'Unauthorized to delete notifications.' },
      { status: auth.status }
    )
  }

  try {
    const notificationId = params.id
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required.' },
        { status: 400 }
      )
    }

    const firestore = getAdminFirestore()
    const docRef = firestore.collection(PUBLIC_NOTIFICATIONS_COLLECTION).doc(notificationId)

    const doc = await docRef.get()
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Notification not found.' },
        { status: 404 }
      )
    }

    // ── 2. Actual Deletion ───────────────────────────────────────────
    await docRef.delete()

    return NextResponse.json({
      success: true,
      message: 'Notification deleted securely.',
    })
  } catch (error) {
    console.error('[Notifications API] DELETE failed:', error)
    return NextResponse.json(
      { error: 'Could not delete notification.' },
      { status: 500 }
    )
  }
}
