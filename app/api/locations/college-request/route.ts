import { NextResponse } from 'next/server';
import { submitCollegeRequest } from '@/lib/locations/service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { collegeName, city, district, state, country, address, submittedBy } = body;

    // Validate required fields
    if (!collegeName || !city || !district || !state || !country || !submittedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const requestId = await submitCollegeRequest({
      collegeName,
      city,
      district,
      state,
      country,
      address: address || '',
      submittedBy,
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: 'College request submitted. Awaiting admin approval.',
    });
  } catch (error) {
    console.error('Error submitting college request:', error);
    return NextResponse.json(
      { error: 'Failed to submit college request' },
      { status: 500 }
    );
  }
}
