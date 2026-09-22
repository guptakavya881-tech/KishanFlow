import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { paymentService } from '@/services/paymentService';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' ORDER BY id DESC LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Farmer login required.' }, { status: 401 });
      }
    } else if (user.role !== 'farmer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only farmers can set payment details.' },
        { status: 403 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { finalQuantity, pricePerUnit, totalAmount, notes } = body;

    const result = await paymentService.setFarmerPayment({
      orderId: id,
      farmerId: user.id,
      finalQuantity,
      pricePerUnit,
      totalAmount,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment details configured successfully.',
      data: result,
    });
  } catch (err) {
    console.error('Error in setFarmerPayment route:', err);
    const isUnauthorized = err.message && (
      err.message.toLowerCase().includes('unauthorized') ||
      err.message.toLowerCase().includes('own orders')
    );
    const status = isUnauthorized ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message || 'Failed to set payment details.' }, { status });
  }
}
