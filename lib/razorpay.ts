import Razorpay from 'razorpay'
import crypto from 'crypto'

// The key ID is public by design (it ships to the browser), so fall back to the
// NEXT_PUBLIC_ copy rather than failing when only that one is set.
const RAZORPAY_KEY_ID = (
  process.env.RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  ''
).trim()
// Never falls back to a NEXT_PUBLIC_ value — the secret must stay server-only.
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim()

export function getRazorpayInstance(): Razorpay {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    const missing = [
      !RAZORPAY_KEY_ID && 'RAZORPAY_KEY_ID (or NEXT_PUBLIC_RAZORPAY_KEY_ID)',
      !RAZORPAY_KEY_SECRET && 'RAZORPAY_KEY_SECRET',
    ].filter(Boolean)
    throw new Error(`Razorpay credentials are not configured. Missing: ${missing.join(', ')}`)
  }

  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  })
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured.')
  }

  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  const expected = Buffer.from(expectedSignature)
  const received = Buffer.from(signature)

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  )
}
