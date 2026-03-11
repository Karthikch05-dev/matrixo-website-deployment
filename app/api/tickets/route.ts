import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - this route needs to be dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

// This would connect to your Google Sheet to get real-time ticket count
// For now, we'll create a simple counter that reads from Google Sheets

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL
    
    if (!GOOGLE_SCRIPT_URL) {
      return NextResponse.json({ error: 'Google Script URL not configured' }, { status: 500 })
    }

    // Fetch ticket count from Google Sheet
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getTicketCount&eventId=${eventId}`, {
      method: 'GET',
      cache: 'no-store', // Don't cache, always get fresh data
    })

    const data = await response.json()

    return NextResponse.json({
      eventId,
      ticketsSold: data.ticketsSold || 0,
      totalCapacity: data.totalCapacity || 100,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching ticket count:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch ticket count',
      ticketsSold: 0,
      totalCapacity: 100
    }, { status: 500 })
  }
}
