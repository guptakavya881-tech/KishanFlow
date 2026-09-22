import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCropsByUserId, getBookedCropsByUserId, createCropRecord, createNotificationRecord } from '@/lib/db';

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

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    // Return ONLY crops with an active/upcoming/confirmed booking by default
    const crops = showAll ? getCropsByUserId(user.id) : getBookedCropsByUserId(user.id);
    return NextResponse.json({ success: true, crops });
  } catch (err) {
    console.error('Error in GET /api/farmer/crops:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, quantity, unit, harvestStatus, expectedHarvestDate, notes } = body;

    // Field validations
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Crop name is required.' }, { status: 400 });
    }
    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity must be a positive number.' }, { status: 400 });
    }
    if (!unit || !unit.trim()) {
      return NextResponse.json({ success: false, error: 'Unit is required.' }, { status: 400 });
    }

    const finalStatus = calculateHarvestStatus(expectedHarvestDate, harvestStatus);

    const crop = createCropRecord({
      userId: user.id,
      name: name.trim(),
      quantity: numQty,
      unit: unit.trim(),
      harvestStatus: finalStatus,
      expectedHarvestDate: expectedHarvestDate ? expectedHarvestDate.trim() : null,
      notes: notes ? notes.trim() : null,
    });

    // Create persistent notification for crop added
    createNotificationRecord({
      userId: user.id,
      type: 'crop',
      title: `Crop added: ${crop.name}`,
      description: `Successfully added ${crop.name} (${crop.quantity} ${crop.unit}) with status "${crop.harvestStatus}".`,
      icon: 'Sprout',
    });

    return NextResponse.json({
      success: true,
      crop,
      message: 'Crop added successfully.',
    });
  } catch (err) {
    console.error('Error in POST /api/farmer/crops:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
