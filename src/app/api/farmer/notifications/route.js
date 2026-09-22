import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getNotificationsByUserId,
  getTotalNotificationCount,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/db';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || null;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const notifications = getNotificationsByUserId(user.id, limit, offset, type);
    const totalCount = getTotalNotificationCount(user.id, type);
    const unreadCount = getUnreadNotificationCount(user.id);
    const hasMore = offset + notifications.length < totalCount;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      totalCount,
      hasMore,
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'farmer') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, markAll } = body;

    if (markAll) {
      markAllNotificationsRead(user.id);
    } else if (id) {
      markNotificationRead(id, user.id);
    } else {
      markAllNotificationsRead(user.id);
    }

    const unreadCount = getUnreadNotificationCount(user.id);

    return NextResponse.json({
      success: true,
      unreadCount,
      message: markAll ? 'All notifications marked as read.' : 'Notification marked as read.',
    });
  } catch (err) {
    console.error('Error updating notifications:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
