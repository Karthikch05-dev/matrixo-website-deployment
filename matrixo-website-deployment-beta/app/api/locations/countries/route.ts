import { NextResponse } from 'next/server';
import { getCountries } from '@/lib/locations/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const countries = await getCountries();
    return NextResponse.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
