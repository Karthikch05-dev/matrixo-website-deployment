import { NextResponse } from 'next/server'
import { postToGoogleAppsScript } from '@/lib/googleAppsScript'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teamName, email, teamLead, teamMember1, teamMember2, teamMember3, teamMember4 } = body

    if (!teamName || !email || !teamLead || !teamMember1 || !teamMember2) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    const registrationForward = await postToGoogleAppsScript({
      action: 'devAgentic2Registration',
      teamName,
      email,
      teamLead,
      teamMember1,
      teamMember2,
      teamMember3,
      teamMember4
    })

    if (!registrationForward.ok) {
      return NextResponse.json(
        { error: 'Failed to forward registration.' },
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
    console.error('DevAgentic2 Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to process registration. Please try again later.' },
      { status: 500 }
    )
  }
}
