import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCropByIdAndUser, updateCropRecord, deleteCropRecord, createNotificationRecord, getActiveBookingForCrop, removeBookedCropRecord } from '@/lib/db';

function calculateHarvestStatus(expectedHarvestDate, explicitStatus) {
  if (explicitStatus && ['Ready for Procurement', 'Nearly Ready', 'Growing'].includes(explicitStatus)) {
    return explicitStatus;
  }
  if (!expectedHarvestDate) return 'Growing';

  try {
    const harvestDate = new Date(expectedHarvestDate);
    if (isNaN(harvestDate.getTime())) return 'Growing';

    const now = new Date();
    const diffDays = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return 'Ready for Procurement';
    } else if (diffDays <= 15) {
      return 'Nearly Ready';
    } else {
      return 'Growing';
    }
  } catch {
    return 'Growing';
  }
}

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const crop = getCropByIdAndUser(id, user.id);
    if (!crop) {
      return NextResponse.json({ success: false, error: 'Crop not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, crop });
  } catch (err) {
    console.error('Error in GET /api/farmer/crops/[id]:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = getCropByIdAndUser(id, user.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Crop not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ success: false, error: 'Crop name cannot be empty.' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.quantity !== undefined) {
      const numQty = Number(body.quantity);
      if (isNaN(numQty) || numQty <= 0) {
        return NextResponse.json({ success: false, error: 'Quantity must be greater than 0.' }, { status: 400 });
      }
      updates.quantity = numQty;
    }

    if (body.unit !== undefined) {
      updates.unit = body.unit.trim();
    }

    if (body.expectedHarvestDate !== undefined) {
      updates.expectedHarvestDate = body.expectedHarvestDate ? body.expectedHarvestDate.trim() : null;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes ? body.notes.trim() : null;
    }

    // Dynamic or explicit status
    const targetHarvestDate = updates.expectedHarvestDate !== undefined ? updates.expectedHarvestDate : existing.expectedHarvestDate;
    updates.harvestStatus = calculateHarvestStatus(targetHarvestDate, body.harvestStatus);

    const updated = updateCropRecord(id, user.id, updates);

    // Create notification for crop update
    createNotificationRecord({
      userId: user.id,
      type: 'crop',
      title: `Crop updated: ${updated.name}`,
      description: `Updated details for ${updated.name}: ${updated.quantity} ${updated.unit}, Status: ${updated.harvestStatus}.`,
      icon: 'Edit3',
    });

    return NextResponse.json({
      success: true,
      crop: updated,
      message: 'Crop updated successfully.',
    });
  } catch (err) {
    console.error('Error in PUT /api/farmer/crops/[id]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const cropId = searchParams.get('cropId');

    const result = removeBookedCropRecord({
      id,
      userId: user.id,
      bookingId: bookingId || null,
      cropId: cropId || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to remove crop.' },
        { status: result.notFound ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Crop removed successfully.',
      removedName: result.removedName,
    });
  } catch (err) {
    console.error('Error in DELETE /api/farmer/crops/[id]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
