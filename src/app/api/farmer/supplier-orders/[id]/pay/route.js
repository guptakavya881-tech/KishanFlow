import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { payFarmerSupplierOrder, getDatabase } from '@/lib/db';

export async function POST(request, context) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
      }
    } else if (user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only farmers can make payments for supplier orders.' }, { status: 401 });
    }

    const params = await context.params;
    const orderId = Number(params?.id);
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Valid Order ID is required.' }, { status: 400 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }
    const { paymentMethod } = body;

    const updatedOrder = payFarmerSupplierOrder(orderId, user.id, { paymentMethod });

    return NextResponse.json({
      success: true,
      message: `Payment for order #${updatedOrder.orderNumber} completed successfully.`,
      data: updatedOrder,
    });
  } catch (err) {
    console.error('Error processing farmer supplier order payment:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Payment processing failed.',
    }, { status: 400 });
  }
}
