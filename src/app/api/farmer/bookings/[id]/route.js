import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBookingByIdAndUser, updateBookingStatus, createNotificationRecord } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const booking = getBookingByIdAndUser(id, user.id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (err) {
    console.error('Error fetching booking:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required.' }, { status: 400 });
    }

    const updated = updateBookingStatus(id, user.id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    if (status === 'Cancelled') {
      createNotificationRecord({
        userId: user.id,
        type: 'booking',
        title: `Booking ${updated.bookingNumber} Cancelled`,
        description: `Your procurement booking for ${updated.cropName} (${updated.tokenNumber}) has been cancelled.`,
        icon: 'XCircle',
      });
    }

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `Booking status updated to ${status}.`,
    });
  } catch (err) {
    console.error('Error updating booking:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
