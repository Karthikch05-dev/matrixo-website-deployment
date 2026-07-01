import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

const COLLECTION = 'eventVisibility'

function isAdminOrSubAdmin(role?: string): boolean {
  return role === 'admin' || role === 'sub-admin'
}

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token = authHeader.slice('Bearer '.length)
  const auth = getAdminAuth()
  const firestore = getAdminFirestore()

  const decoded = await auth.verifyIdToken(token)
  const uid = decoded.uid
  const email = decoded.email || null

  let employeeSnap = await firestore.collection('Employees').doc(uid).get()
  if (!employeeSnap.exists && email) {
    const querySnap = await firestore.collection('Employees').where('email', '==', email).limit(1).get()
    if (!querySnap.empty) {
      employeeSnap = querySnap.docs[0]
    }
  }

  if (!employeeSnap.exists) {
    return { error: NextResponse.json({ error: 'Employee profile not found' }, { status: 403 }) }
  }

  const employee = employeeSnap.data() as { role?: string; employeeId?: string; name?: string }
  if (!isAdminOrSubAdmin(employee?.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { employee, firestore }
}

export async function GET() {
  try {
    const firestore = getAdminFirestore()
    const snapshot = await firestore.collection(COLLECTION).get()

    const visibilityMap: Record<string, any> = {}
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const slug = data.eventSlug || doc.id
      visibilityMap[slug] = {
        id: doc.id,
        ...data,
        eventSlug: slug,
        hidden: Boolean(data.hidden),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      }
    })

    return NextResponse.json({ success: true, visibilityMap })
  } catch (error: any) {
    console.error('Error fetching event visibility:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to load event visibility' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) return authResult.error

    const { employee, firestore } = authResult
    const body = await request.json()
    const { eventSlug, hidden, eventId, eventTitle } = body || {}

    if (!eventSlug || typeof hidden !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const docRef = firestore.collection(COLLECTION).doc(eventSlug)
    await docRef.set(
      {
        eventSlug,
        hidden,
        eventId: eventId || null,
        eventTitle: eventTitle || null,
        updatedAt: new Date(),
        updatedBy: employee.employeeId || null,
        updatedByName: employee.name || null,
      },
      { merge: true }
    )

    return NextResponse.json({
      success: true,
      visibility: {
        eventSlug,
        hidden,
        eventId: eventId || null,
        eventTitle: eventTitle || null,
        updatedBy: employee.employeeId || null,
        updatedByName: employee.name || null,
      },
    })
  } catch (error: any) {
    console.error('Error updating event visibility:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update event visibility' },
      { status: 500 }
    )
  }
}
