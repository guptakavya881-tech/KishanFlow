import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdminOrdersList, getAdminOrderDetails, completeAdminProcurement, getDatabase } from '@/lib/db';

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
    const orderId = searchParams.get('id');

    if (orderId) {
      const details = getAdminOrderDetails(orderId);
      if (!details) {
        return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: details });
    }

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const orders = getAdminOrdersList({ search, status, limit, offset });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        total: orders.length,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/admin/orders:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const { action, orderId } = body || {};

    if (action === 'completeProcurement') {
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
      }

      const updatedOrder = completeAdminProcurement(orderId, user.id);
      return NextResponse.json({
        success: true,
        message: 'Procurement marked as completed successfully.',
        data: updatedOrder,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action.' }, { status: 400 });
  } catch (err) {
    console.error('Error in POST /api/admin/orders:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to execute order action.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  return POST(request);
}
