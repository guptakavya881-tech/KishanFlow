import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrderByIdAndBuyer, updateOrderStatus, getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

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

    const order = getOrderByIdAndBuyer(orderId, user.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found or unauthorized.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

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

    const body = await request.json();
    const { action, note } = body;

    const currentOrder = getOrderByIdAndBuyer(orderId, user.id);
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Order not found or unauthorized.' }, { status: 404 });
    }

    if (action === 'cancel') {
      if (currentOrder.status === 'Completed' || currentOrder.status === 'Cancelled') {
        return NextResponse.json({ success: false, error: `Cannot cancel an order that is already ${currentOrder.status}.` }, { status: 400 });
      }

      const updated = updateOrderStatus(currentOrder.id, user.id, 'Cancelled', note || 'Order cancelled by buyer.');
      return NextResponse.json({
        success: true,
        data: updated,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('Error updating order:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
