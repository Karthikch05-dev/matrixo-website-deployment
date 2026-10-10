import { NextResponse } from 'next/server'
import { postToGoogleAppsScript } from '@/lib/googleAppsScript'
import { isValidEmail } from '@/lib/security/sanitize'
import { clientKey, rateLimit } from '@/lib/security/rateLimit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Registrations per IP are capped so the endpoint can't be used to flood
  // the sheet or trigger mass confirmation emails.
  const limit = rateLimit(`register:${clientKey(request)}`, 10, 10 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many registrations from this network. Please try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

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

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
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
