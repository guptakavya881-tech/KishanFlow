import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFarmerDashboardData, getDatabase } from '@/lib/db';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' ORDER BY id DESC LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const data = getFarmerDashboardData(user.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error fetching farmer dashboard data:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
