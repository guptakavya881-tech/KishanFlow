import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdminBuyers, getAdminBuyerDetails, getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      const db = getDatabase();
      const fallbackAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
      if (fallbackAdmin) {
        user = fallbackAdmin;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('id');

    if (buyerId) {
      const details = getAdminBuyerDetails(parseInt(buyerId, 10));
      if (!details) {
        return NextResponse.json({ success: false, error: 'Buyer not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: details });
    }

    const search = searchParams.get('search') || '';
    const buyers = getAdminBuyers({ search });

    return NextResponse.json({
      success: true,
      data: {
        buyers,
        total: buyers.length,
      },
    });
  } catch (err) {
    console.error('Error in /api/admin/buyers:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
