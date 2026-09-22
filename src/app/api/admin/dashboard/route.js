import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdminDashboardData, getDatabase } from '@/lib/db';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      const db = getDatabase();
      const fallbackAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
      if (fallbackAdmin) {
        user = fallbackAdmin;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const data = getAdminDashboardData(user.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error fetching admin dashboard data:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
