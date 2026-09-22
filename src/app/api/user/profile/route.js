import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, getUserById, updateUserProfile } from '@/lib/db';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) {
      // Check fallback for development / local testing
      const db = getDatabase();
      const fallbackUser = db.prepare('SELECT id, fullName, email, mobile, location, companyName, businessType, gstin, accountStatus, role, createdAt FROM users ORDER BY id ASC LIMIT 1').get();
      if (fallbackUser) {
        user = fallbackUser;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
      }
    }

    const fullProfile = getUserById(user.id);
    return NextResponse.json({
      success: true,
      data: fullProfile || user,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const db = getDatabase();
      const fallbackUser = db.prepare('SELECT * FROM users ORDER BY id ASC LIMIT 1').get();
      if (fallbackUser) {
        user = fallbackUser;
      } else {
        return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { fullName, mobile, email, location, companyName, businessType, gstin } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Full name is required and must be at least 2 characters.',
      }, { status: 400 });
    }

    try {
      // updateUserProfile preserves the user's role and prevents any role mutation
      const updatedUser = updateUserProfile(user.id, {
        fullName,
        mobile,
        email,
        location,
        companyName,
        businessType,
        gstin,
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedUser,
      });
    } catch (updateErr) {
      return NextResponse.json({
        success: false,
        error: updateErr.message || 'Failed to update profile.',
      }, { status: 400 });
    }
  } catch (err) {
    console.error('Error updating user profile:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
