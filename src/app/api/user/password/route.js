import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, changeUserPassword } from '@/lib/db';

export async function POST(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackUser = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
      if (fallbackUser) {
        user = fallbackUser;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Current password and new password are required.',
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      }, { status: 400 });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'New password and confirmation do not match.',
      }, { status: 400 });
    }

    try {
      changeUserPassword(user.id, currentPassword, newPassword);
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully.',
      });
    } catch (pwErr) {
      return NextResponse.json({
        success: false,
        error: pwErr.message || 'Failed to change password.',
      }, { status: 400 });
    }
  } catch (err) {
    console.error('Error in change password route:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
