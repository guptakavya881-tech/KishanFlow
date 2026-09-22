import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBuyerEligibleCrops, getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const cropName = searchParams.get('cropName') || searchParams.get('crop') || '';
    const status = searchParams.get('status') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sortBy') || 'recent';
    const minQuantity = searchParams.get('minQuantity') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;

    // Optional user validation - buyer can browse produce
    let user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      const db = getDatabase();
      const fallbackBuyer = db.prepare("SELECT * FROM users WHERE role = 'buyer' ORDER BY id DESC LIMIT 1").get();
      if (fallbackBuyer) {
        user = fallbackBuyer;
      }
    }

    const result = getBuyerEligibleCrops({
      search,
      cropName,
      status,
      location,
      sortBy,
      minQuantity,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Error fetching buyer crops:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
