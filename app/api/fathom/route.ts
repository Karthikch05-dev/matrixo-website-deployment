import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FATHOM_API_KEY = process.env.FATHOM_API_KEY || ''
const FATHOM_BASE_URL = 'https://api.fathom.ai/external/v1'

export async function GET(request: Request) {
  try {
    if (!FATHOM_API_KEY) {
      return NextResponse.json({ error: 'Fathom API key not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const recordingId = searchParams.get('recording_id')
    const cursor = searchParams.get('cursor')

    let url = ''
    const headers: Record<string, string> = {
      'X-Api-Key': FATHOM_API_KEY,
      'Content-Type': 'application/json',
    }

    if (action === 'list') {
      // List recent meetings with summaries, action items, and speakers
      const params = new URLSearchParams({
        include_summary: 'true',
        include_action_items: 'true',
        include_speakers: 'true',
        include_calendar_invitees: 'true',
      })
      if (cursor) params.set('cursor', cursor)
      url = `${FATHOM_BASE_URL}/meetings?${params.toString()}`
    } else if (action === 'summary' && recordingId) {
      url = `${FATHOM_BASE_URL}/recordings/${recordingId}/summary`
    } else if (action === 'transcript' && recordingId) {
      url = `${FATHOM_BASE_URL}/recordings/${recordingId}/transcript`
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = await fetch(url, { headers, cache: 'no-store' })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Fathom API Error]', response.status, errorText)
      return NextResponse.json(
        { error: `Fathom API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Fathom API Route Error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
