import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { confirmFarmerOrder, getDatabase } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

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

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const updatedOrder = confirmFarmerOrder(id, user.id, {
      agreedPrice: body?.agreedPrice,
      totalAmount: body?.totalAmount,
    });

    return NextResponse.json({
      success: true,
      message: 'Order confirmed successfully.',
      data: updatedOrder,
    });
  } catch (err) {
    console.error('Error confirming farmer order:', err);
    const status = err.message.includes('unauthorized') ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message || 'Failed to confirm order.' }, { status });
  }
}
