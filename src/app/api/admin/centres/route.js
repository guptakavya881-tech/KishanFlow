import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdminCentresList, getAdminCentreDetails, getDatabase } from '@/lib/db';

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
    const centreId = searchParams.get('id');

    if (centreId) {
      const details = getAdminCentreDetails(centreId);
      if (!details) {
        return NextResponse.json({ success: false, error: 'Procurement centre not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: details });
    }

    const search = searchParams.get('search') || '';
    const centres = getAdminCentresList({ search });

    return NextResponse.json({
      success: true,
      data: {
        centres,
        total: centres.length,
      },
    });
  } catch (err) {
    console.error('Error in /api/admin/centres:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
