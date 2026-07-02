import { NextResponse } from 'next/server'
import { postToGoogleAppsScript } from '@/lib/googleAppsScript'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      fullName,
      contactNumber,
      email,
      studentId,
      collegeName,
      department,
      year,
      emergencyContact,
      address,
      wantCertificate,
      wantTransport,
      hearAboutEvent,
      eventId,
      eventTitle,
      eventDate,
      ticketType
    } = body

    // Validate required fields
    if (!fullName || !email || !contactNumber || !studentId || !collegeName || !department || !year) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    const registrationForward = await postToGoogleAppsScript({
      action: 'generalRegistration',
      ...body,
    })

    if (!registrationForward.ok) {
      return NextResponse.json(
        { error: 'Failed to forward registration to Google Apps Script.' },
        { status: registrationForward.status }
      )
    }

    const data = registrationForward.data
    if (typeof data === 'object' && data !== null && data.success === false) {
      return NextResponse.json(
        { error: data.error || 'Registration failed.' },
        { status: 500 }
      )
    }

    return NextResponse.json(typeof data === 'object' && data !== null ? data : { success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to process registration. Please try again later.' },
      { status: 500 }
    )
  }
}
