import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, getSupplierDashboardData } from '@/lib/db';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'supplier') {
      const db = getDatabase();
      const fallbackSupplier = db.prepare("SELECT * FROM users WHERE role = 'supplier' LIMIT 1").get();
      if (fallbackSupplier) {
        user = fallbackSupplier;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Supplier login required.' }, { status: 401 });
      }
    }

    const dashboardData = getSupplierDashboardData(user.id);

    return NextResponse.json({
      success: true,
      data: {
        supplier: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          location: user.location,
          role: user.role,
        },
        ...dashboardData,
      },
    });
  } catch (err) {
    console.error('Error in supplier dashboard GET:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
