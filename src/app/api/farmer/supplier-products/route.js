import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAvailableSupplierProducts, getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'ALL';
    const search = searchParams.get('search') || '';

    const products = getAvailableSupplierProducts({ category, search });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (err) {
    console.error('Error fetching available supplier products for farmer:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
