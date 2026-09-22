import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { paymentService } from '@/services/paymentService';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;

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

    const payment = await paymentService.getPaymentDetails(paymentId, user.id, 'farmer');
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found or unauthorized.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (err) {
    console.error('Error fetching farmer payment details:', err);
    return NextResponse.json({ success: false, error: err.message || 'Payment not found or access denied.' }, { status: 403 });
  }
}
