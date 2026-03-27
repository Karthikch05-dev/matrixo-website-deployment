import { NextResponse } from 'next/server';
import { getCollegeById } from '@/lib/locations/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'College ID parameter is required' },
        { status: 400 }
      );
    }

    const college = await getCollegeById(id);

    if (!college) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: college.id,
      name: college.name,
      country: college.country,
      state: college.state,
      district: college.district,
    });
  } catch (error) {
    console.error('Error looking up college:', error);
    return NextResponse.json(
      { error: 'Failed to look up college' },
      { status: 500 }
    );
  }
}
