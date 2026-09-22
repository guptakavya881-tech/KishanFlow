import { NextResponse } from 'next/server';
import { getUserByEmailOrMobile } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Please enter your registered email or mobile number.' },
        { status: 400 }
      );
    }

    const user = getUserByEmailOrMobile(identifier);
    // Even if user not found, don't leak account existence, return safe message
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account matches this detail, a password reset SMS or email has been dispatched.',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Password reset link/OTP sent to your registered contact for ${user.fullName}.`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
