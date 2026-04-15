import { NextResponse } from 'next/server';
import { getCollegesByDistrict, searchColleges } from '@/lib/locations/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const search = searchParams.get('search');

    if (search) {
      // Search mode
      const colleges = await searchColleges(search, district || undefined);
      return NextResponse.json(colleges);
    }

    if (!district) {
      return NextResponse.json(
        { error: 'District parameter is required' },
        { status: 400 }
      );
    }

    const colleges = await getCollegesByDistrict(district);
    return NextResponse.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    );
  }
}
