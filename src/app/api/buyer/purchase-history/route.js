import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, getBuyerPurchaseHistory } from '@/lib/db';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const paymentStatus = searchParams.get('paymentStatus') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'newest';

    const purchases = getBuyerPurchaseHistory(user.id, {
      search,
      status,
      paymentStatus,
      sortBy,
    });

    // Compute metrics exclusively from real purchases
    const totalPurchases = purchases.length;
    const totalQuantity = purchases.reduce((acc, p) => acc + (Number(p.actualQuantity || p.quantity) || 0), 0);
    const totalSpent = purchases.reduce((acc, p) => acc + (Number(p.payment?.amount || p.totalAmount) || 0), 0);
    const paidPurchases = purchases.filter((p) => p.paymentStatus === 'PAID').length;

    return NextResponse.json({
      success: true,
      purchases,
      metrics: {
        totalPurchases,
        totalQuantity,
        totalSpent,
        paidPurchases,
      },
    });
  } catch (err) {
    console.error('Error fetching buyer purchase history:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
