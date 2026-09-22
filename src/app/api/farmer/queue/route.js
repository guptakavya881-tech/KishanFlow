import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getActiveQueuesByUserId, getCompletedQueuesByUserId } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const queues = getActiveQueuesByUserId(user.id);
    const completedQueues = getCompletedQueuesByUserId(user.id);

    const firstActive = queues[0] || null;

    return NextResponse.json({
      success: true,
      hasActiveBooking: queues.length > 0,
      queues,
      completedQueues,
      activeCount: queues.length,
      completedCount: completedQueues.length,
      // Backward-compatible fields for any callers expecting top-level single queue
      centreName: firstActive?.centreName || '',
      yourToken: firstActive?.tokenNumber || '',
      currentServingToken: firstActive?.currentServingToken || '',
      peopleAhead: firstActive?.peopleAhead ?? 0,
      estimatedWaitMinutes: firstActive?.estimatedWaitMinutes ?? 0,
      cropName: firstActive?.cropName || '',
      quantity: firstActive?.quantity || 0,
      unit: firstActive?.unit || 'kg',
      date: firstActive?.date || '',
      timeSlot: firstActive?.timeSlot || '',
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err) {
    console.error('Error fetching farmer queue status:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
