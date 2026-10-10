import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebaseConfig'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { postToGoogleAppsScript } from '@/lib/googleAppsScript'
import { clampText, isValidEmail } from '@/lib/security/sanitize'
import { clientKey, rateLimit } from '@/lib/security/rateLimit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Five messages per IP per ten minutes is plenty for people, and stops
  // the form being used to flood the inbox.
  const limit = rateLimit(`contact:${clientKey(request)}`, 5, 10 * 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'You’ve sent a few messages already. Please try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    const name = clampText(body?.name, 120)
    const email = clampText(body?.email, 254)
    const phone = clampText(body?.phone, 20)
    const subject = clampText(body?.subject, 120) || 'No Subject'
    const message = clampText(body?.message, 4000)

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Save to Firestore (primary — always works, no external API needed)
    await addDoc(collection(db, 'contactSubmissions'), {
      name,
      email,
      phone,
      subject,
      message,
      submittedAt: Timestamp.now(),
      status: 'unread',
    })

    // Forward to Google Apps Script for email delivery and sheet logging.
    try {
      await postToGoogleAppsScript({ action: 'contactMessage', name, email, phone, subject, message })
    } catch (scriptErr) {
      console.warn('Google Apps Script forwarding failed (non-critical):', scriptErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to save message. Please try again later.' }, { status: 500 })
  }
}
