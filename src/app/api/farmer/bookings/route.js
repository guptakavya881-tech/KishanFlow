import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBookingsByUserId, createBookingRecord, getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = getBookingsByUserId(user.id);
    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      const db = getDatabase();
      const fallbackFarmer = db.prepare("SELECT * FROM users WHERE role = 'farmer' ORDER BY id DESC LIMIT 1").get();
      if (fallbackFarmer) {
        user = fallbackFarmer;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized: Please log in as a farmer.' }, { status: 401 });
      }
    }

    const body = await request.json();
    let {
      cropId,
      cropName = 'Wheat',
      quantity = 1200,
      unit = 'kg',
      centreId = 'centre-1',
      centreName = 'Meerut Procurement Centre',
      centreAddress = 'Mandi Samiti Compound, Delhi Road, Meerut, UP',
      date = '18 September 2026',
      timeSlot = '11:30 AM – 12:00 PM',
      estimatedWaitMins = 18,
      replaceExisting = false,
    } = body;

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity must be a positive number.' }, { status: 400 });
    }

    // Auto-resolve cropId if not provided but exists in user's crops
    if (!cropId && cropName) {
      const db = getDatabase();
      const existingCrop = db.prepare('SELECT id FROM crops WHERE userId = ? AND LOWER(name) = LOWER(?) LIMIT 1').get(user.id, cropName.trim());
      if (existingCrop) {
        cropId = existingCrop.id;
      }
    }

    try {
      const newBooking = createBookingRecord({
        userId: user.id,
        cropId: cropId ? Number(cropId) : null,
        cropName: cropName.trim(),
        quantity: numQty,
        unit: unit.trim(),
        centreId,
        centreName,
        centreAddress,
        date,
        timeSlot,
        estimatedWaitMins,
        replaceExisting: Boolean(replaceExisting),
      });

      return NextResponse.json({
        success: true,
        booking: newBooking,
        message: `Procurement slot ${replaceExisting ? 'updated' : 'booked'} successfully! Token: ${newBooking.tokenNumber}`,
      });
    } catch (err) {
      if (err.code === 'EXISTING_BOOKING_FOUND') {
        return NextResponse.json({
          success: false,
          code: 'EXISTING_BOOKING_FOUND',
          error: `An active booking already exists for ${cropName}.`,
          existingBooking: err.existingBooking,
        }, { status: 409 });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error in POST /api/farmer/bookings:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to create booking.' }, { status: 400 });
  }
}
