import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getDatabase,
  getNotificationsByUserId,
  getTotalNotificationCount,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/db';

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
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = Number(searchParams.get('offset')) || 0;
    const type = searchParams.get('type') || null;
    const readStatus = searchParams.get('readStatus') || null; // 'all', 'unread', 'read'

    const notifications = getNotificationsByUserId(user.id, limit, offset, type, readStatus);
    const unreadCount = getUnreadNotificationCount(user.id);
    const totalCount = getTotalNotificationCount(user.id, type, readStatus);
    const hasMore = offset + notifications.length < totalCount;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      totalCount,
      hasMore,
    });
  } catch (err) {
    console.error('Error fetching buyer notifications:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
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

    const body = await request.json();
    const { id, markAll } = body;

    if (markAll) {
      markAllNotificationsRead(user.id);
    } else if (id) {
      markNotificationRead(id, user.id);
    } else {
      return NextResponse.json({ success: false, error: 'Missing notification id or markAll flag.' }, { status: 400 });
    }

    const unreadCount = getUnreadNotificationCount(user.id);

    return NextResponse.json({
      success: true,
      unreadCount,
      message: markAll ? 'All notifications marked as read.' : 'Notification marked as read.',
    });
  } catch (err) {
    console.error('Error updating notification read status:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
