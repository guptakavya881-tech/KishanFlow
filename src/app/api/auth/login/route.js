import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmailOrMobile } from '../../../../lib/db.js';
import { comparePassword, signToken, COOKIE_OPTIONS } from '../../../../lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password, role: expectedRole } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Please provide your login credentials and password.' },
        { status: 400 }
      );
    }

    // Find user by email or mobile or username (prioritizing expectedRole if provided)
    const user = getUserByEmailOrMobile(identifier, expectedRole);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/mobile or password.' },
        { status: 401 }
      );
    }

    // Check if role matches expected role (case-insensitive)
    if (expectedRole && user.role.toLowerCase() !== String(expectedRole).trim().toLowerCase()) {
      const roleNames = {
        farmer: 'Farmer',
        buyer: 'Buyer',
        admin: 'Admin',
        supplier: 'Supplier',
      };
      const userRoleKey = user.role.toLowerCase();
      return NextResponse.json(
        {
          success: false,
          error: `This account is registered as a ${roleNames[userRoleKey] || user.role}. Please log in via the ${roleNames[userRoleKey] || user.role} portal.`,
        },
        { status: 403 }
      );
    }

    // Compare password hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/mobile or password.' },
        { status: 401 }
      );
    }

    // Issue signed JWT in HttpOnly cookie
    const token = signToken(user);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_OPTIONS.name, token, COOKIE_OPTIONS);

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: user.id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        location: user.location,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
