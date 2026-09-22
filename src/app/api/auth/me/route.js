import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth.js';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      authenticated: !!user,
      user: user || null,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 }
    );
  }
}
