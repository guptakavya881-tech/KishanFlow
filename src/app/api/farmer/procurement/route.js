import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getActiveBookingByUserId, getBookingsByUserId } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const activeBooking = getActiveBookingByUserId(user.id);
    let targetBooking = activeBooking;

    if (!targetBooking) {
      const allBookings = getBookingsByUserId(user.id);
      if (allBookings.length > 0) {
        targetBooking = allBookings[0];
      }
    }

    if (!targetBooking) {
      return NextResponse.json({
        success: true,
        hasProcurement: false,
        message: 'No procurement records found.',
      });
    }

    const isCompleted = targetBooking.status === 'Completed';

    const steps = [
      { step: 1, title: 'Gate Entry & Vehicle Check', status: 'completed', timestamp: '09:15 AM' },
      { step: 2, title: 'Identity & Land Record Verification', status: 'completed', timestamp: '09:30 AM' },
      { step: 3, title: 'Crop Sample Quality Inspection', status: 'completed', timestamp: '09:55 AM' },
      { step: 4, title: 'Moisture Testing (< 12% Moisture)', status: 'completed', timestamp: '10:20 AM' },
      { step: 5, title: 'Electronic Weighing Scale Unloading', status: isCompleted ? 'completed' : 'active', timestamp: isCompleted ? '10:50 AM' : 'In Progress (Bay 2)' },
      { step: 6, title: 'Government MSP Procurement Slip Generation', status: isCompleted ? 'completed' : 'pending', timestamp: isCompleted ? '11:15 AM' : 'Pending Weigh Slip' },
      { step: 7, title: 'Direct Benefit Transfer (DBT) Authorization', status: isCompleted ? 'completed' : 'pending', timestamp: isCompleted ? '01:30 PM' : 'Pending' },
      { step: 8, title: 'Bank Account Credit Notification', status: isCompleted ? 'completed' : 'pending', timestamp: isCompleted ? '03:45 PM' : 'Pending Settlement' },
    ];

    return NextResponse.json({
      success: true,
      hasProcurement: true,
      bookingNumber: targetBooking.bookingNumber,
      tokenNumber: targetBooking.tokenNumber,
      cropName: targetBooking.cropName,
      bookedQuantity: targetBooking.quantity,
      actualQuantity: targetBooking.quantity,
      unit: targetBooking.unit,
      centreName: targetBooking.centreName,
      date: targetBooking.date,
      timeSlot: targetBooking.timeSlot,
      status: targetBooking.status,
      currentStep: isCompleted ? 8 : 5,
      steps,
    });
  } catch (err) {
    console.error('Error fetching procurement status:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
