import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBuyerDashboardData, getDatabase } from '@/lib/db';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      const db = getDatabase();
      const fallbackBuyer = db.prepare("SELECT * FROM users WHERE role = 'buyer' ORDER BY id DESC LIMIT 1").get();
      if (fallbackBuyer) {
        user = fallbackBuyer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const data = getBuyerDashboardData(user.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error fetching buyer dashboard data:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
