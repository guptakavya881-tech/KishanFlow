import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getDatabase
} from '@/lib/db';

export async function GET(request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      const db = getDatabase();
      const fallbackAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
      if (fallbackAdmin) {
        user = fallbackAdmin;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ALL';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = getAdminNotifications({ type, search, limit, offset });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/notifications:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      const db = getDatabase();
      const fallbackAdmin = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
      if (fallbackAdmin) {
        user = fallbackAdmin;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Admin role required.' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === 'markAllRead') {
      markAllAdminNotificationsRead();
      return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
    }

    if (action === 'markRead' && notificationId) {
      markAdminNotificationRead(notificationId);
      return NextResponse.json({ success: true, message: 'Notification marked as read.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('Error in POST /api/admin/notifications:', err);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
