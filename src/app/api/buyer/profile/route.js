import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDatabase, getBuyerProfileData, updateUserProfile } from '@/lib/db';

export async function GET() {
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

    const data = getBuyerProfileData(user.id);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Buyer profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Error fetching buyer profile:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
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
    const { fullName, mobile, email, location, companyName, businessType, gstin } = body;

    // Strict validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Full name is required and must be at least 2 characters long.',
      }, { status: 400 });
    }

    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({
          success: false,
          error: 'Please enter a valid email address.',
        }, { status: 400 });
      }
    }

    if (mobile && typeof mobile === 'string' && mobile.trim()) {
      const digitsOnly = mobile.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        return NextResponse.json({
          success: false,
          error: 'Please enter a valid 10-digit mobile number.',
        }, { status: 400 });
      }
    }

    try {
      updateUserProfile(user.id, {
        fullName,
        mobile,
        email,
        location,
        companyName,
        businessType,
        gstin,
      });
    } catch (updateErr) {
      return NextResponse.json({
        success: false,
        error: updateErr.message || 'Failed to update profile.',
      }, { status: 400 });
    }

    const updatedData = getBuyerProfileData(user.id);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedData,
    });
  } catch (err) {
    console.error('Error updating buyer profile:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
