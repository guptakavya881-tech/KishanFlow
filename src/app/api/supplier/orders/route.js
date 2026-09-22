import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, getSupplierOrders, updateSupplierOrderStatus } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const limit = searchParams.get('limit') || 50;

    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackSupplier = db.prepare("SELECT * FROM users WHERE role = 'supplier' LIMIT 1").get();
      if (fallbackSupplier) {
        user = fallbackSupplier;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    } else if (user.role !== 'supplier') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only suppliers can access supplier orders.' }, { status: 401 });
    }

    const orders = getSupplierOrders(user.id, { status, limit });

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error('Error fetching supplier orders:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackSupplier = db.prepare("SELECT * FROM users WHERE role = 'supplier' LIMIT 1").get();
      if (fallbackSupplier) {
        user = fallbackSupplier;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    } else if (user.role !== 'supplier') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only suppliers can update supplier orders.' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action, status } = body;

    let targetStatus = status;
    if (action === 'confirm') targetStatus = 'CONFIRMED';
    else if (action === 'deliver') targetStatus = 'DELIVERED';
    else if (action === 'cancel') targetStatus = 'CANCELLED';

    if (!orderId || !targetStatus) {
      return NextResponse.json({ success: false, error: 'Order ID and valid action or status are required.' }, { status: 400 });
    }

    const updated = updateSupplierOrderStatus(Number(orderId), user.id, targetStatus);

    return NextResponse.json({
      success: true,
      message: `Order status successfully updated to ${targetStatus}.`,
      data: updated,
    });
  } catch (err) {
    console.error('Error updating supplier order status:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 400 });
  }
}
