import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdmin'
import { getPaymentHistory } from '@/lib/payments/ledger'

export const dynamic = 'force-dynamic'

/**
 * The caller's own purchase history (events and StudentVault). Guest checkouts
 * are matched by email only when the account's email is verified, so nobody
 * can see someone else's payments by signing up with their address.
 */
export async function GET(request: NextRequest) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  let decoded
  try {
    decoded = await getAdminAuth().verifyIdToken(token)
  } catch {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  }

  try {
    const email = decoded.email && decoded.email_verified ? decoded.email : null
    const items = await getPaymentHistory(decoded.uid, email)
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[me/payments] failed:', error)
    return NextResponse.json({ error: 'Could not load your purchases.' }, { status: 500 })
  }
}
