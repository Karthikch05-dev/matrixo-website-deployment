import { NextResponse } from 'next/server'
import { db } from '@/lib/firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { postToGoogleAppsScript } from '@/lib/googleAppsScript'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Save to Firestore (primary — always works, no external API needed)
    await addDoc(collection(db, 'contactSubmissions'), {
      name,
      email,
      phone: phone || '',
      subject: subject || 'No Subject',
      message,
      submittedAt: Timestamp.now(),
      status: 'unread',
    })

    // Forward to Google Apps Script for email delivery and sheet logging.
    try {
      await postToGoogleAppsScript({
        action: 'contactMessage',
        name,
        email,
        phone: phone || '',
        subject: subject || 'No Subject',
        message,
      })
    } catch (scriptErr) {
      console.warn('Google Apps Script forwarding failed (non-critical):', scriptErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to save message. Please try again later.' },
      { status: 500 }
    )
  }
}
