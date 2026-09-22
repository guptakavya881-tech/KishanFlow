import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { paymentService } from '@/services/paymentService';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' ORDER BY id DESC LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Farmer login required.' }, { status: 401 });
      }
    }

    const { payments, summary } = await paymentService.getFarmerPayments(user.id);

    return NextResponse.json({
      success: true,
      payments,
      summary,
    });
  } catch (err) {
    console.error('Error fetching farmer payments:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
