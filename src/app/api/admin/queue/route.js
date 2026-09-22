import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCentreQueueState, getAdminQueueOverview, advanceQueueOrderStatus, completeAdminProcurement } from '@/lib/db';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = searchParams.get('centreId');

    if (centreId) {
      const queueState = getCentreQueueState(centreId);
      if (!queueState) {
        return NextResponse.json({ success: false, error: 'Procurement centre not found.' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: queueState,
      });
    }

    const overview = getAdminQueueOverview();
    return NextResponse.json({
      success: true,
      data: {
        centres: overview,
        totalCentres: overview.length,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/admin/queue:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, orderId, tokenNumber, bookingId, farmerId, farmerCropId, nextStatus, note } = body;

    if (action === 'completeProcurement' || nextStatus === 'PROCUREMENT_COMPLETED') {
      try {
        const updated = completeAdminProcurement(orderId, user.id, {
          tokenNumber,
          bookingId,
          farmerId,
          farmerCropId,
        });
        return NextResponse.json({
          success: true,
          data: updated,
          message: 'Procurement successfully marked as completed.',
        });
      } catch (err) {
        const isNotFound = (err.message || '').includes('Order not found');
        return NextResponse.json({
          success: false,
          error: err.message || 'Failed to complete procurement.',
        }, { status: isNotFound ? 404 : 400 });
      }
    }

    if (action === 'advanceStatus' && nextStatus) {
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'orderId is required.' }, { status: 400 });
      }
      const updated = advanceQueueOrderStatus({
        orderId: Number(orderId),
        nextStatus,
        note,
        adminId: user.id,
      });
      return NextResponse.json({
        success: true,
        data: updated,
        message: `Order advanced to ${nextStatus}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid queue action.' }, { status: 400 });
  } catch (err) {
    console.error('Error in POST /api/admin/queue:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update queue state.' }, { status: 400 });
  }
}
