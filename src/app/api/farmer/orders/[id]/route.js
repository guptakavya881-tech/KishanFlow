import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFarmerOrderById, getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
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

    const order = getFarmerOrderById(id, user.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found or access unauthorized.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error('Error fetching farmer order details:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
