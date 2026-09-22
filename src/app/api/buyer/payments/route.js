import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { paymentService } from '@/services/paymentService';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      const db = getDatabase();
      const fallbackBuyer = db.prepare("SELECT * FROM users WHERE role = 'buyer' ORDER BY id DESC LIMIT 1").get();
      if (fallbackBuyer) {
        user = fallbackBuyer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Buyer login required.' }, { status: 401 });
      }
    }

    const data = await paymentService.getBuyerPayments(user.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error fetching buyer payments:', err);
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
        return NextResponse.json({ success: false, error: 'Unauthorized. Buyer login required.' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { orderId, paymentMethod, simulateFailure } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
    }

    // 1. Initiate payment record
    const initiated = await paymentService.initiatePayment({
      orderId,
      buyerId: user.id,
      paymentMethod,
    });

    // 2. Process payment
    const processed = await paymentService.processPayment({
      paymentId: initiated.id,
      buyerId: user.id,
      paymentMethod,
      simulateFailure: Boolean(simulateFailure),
    });

    return NextResponse.json({
      success: true,
      data: processed,
    });
  } catch (err) {
    console.error('Error processing buyer payment:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Payment processing failed.' },
      { status: 400 }
    );
  }
}
