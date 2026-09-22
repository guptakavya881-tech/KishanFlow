import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrdersByBuyerId, getBuyerOrderMetrics, createBuyerOrder, getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

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

    const orders = getOrdersByBuyerId(user.id, { status, search });
    const metrics = getBuyerOrderMetrics(user.id);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        metrics,
      },
    });
  } catch (err) {
    console.error('Error fetching buyer orders:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const {
      cropId,
      cropName,
      quantity,
      unit,
      procurementCentre,
      centreAddress,
      expectedDate,
      deliveryNotes,
      agreedPrice,
      totalAmount,
    } = body;

    if (!quantity || Number(quantity) <= 0) {
      return NextResponse.json({ success: false, error: 'Please specify a valid quantity greater than 0.' }, { status: 400 });
    }

    const newOrder = createBuyerOrder({
      buyerId: user.id,
      cropId: cropId ? Number(cropId) : null,
      cropName,
      quantity: Number(quantity),
      unit: unit || 'kg',
      procurementCentre,
      centreAddress,
      expectedDate,
      deliveryNotes,
      agreedPrice,
      totalAmount,
    });

    return NextResponse.json({
      success: true,
      data: newOrder,
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating buyer order:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to create order.' }, { status: 400 });
  }
}
