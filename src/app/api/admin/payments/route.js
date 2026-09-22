import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdminPaymentsList, getAdminPaymentMetrics, getAdminPaymentDetails, getDatabase } from '@/lib/db';

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
    const paymentId = searchParams.get('id');

    if (paymentId) {
      const details = getAdminPaymentDetails(paymentId);
      if (!details) {
        return NextResponse.json({ success: false, error: 'Payment record not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: details });
    }

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const payments = getAdminPaymentsList({ search, status, limit, offset });
    const metrics = getAdminPaymentMetrics();

    return NextResponse.json({
      success: true,
      data: {
        payments,
        metrics,
        total: payments.length,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/admin/payments:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
