import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUser, getUserByEmail, getUserByMobile } from '../../../../lib/db.js';
import { hashPassword, signToken, COOKIE_OPTIONS } from '../../../../lib/auth.js';
import { validateFarmerRegistration, validateBuyerRegistration, validateAdminRegistration, validateSupplierRegistration } from '../../../../lib/validators.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const rawRole = (body.role || '').trim();
    const role = rawRole.toLowerCase();

    // Registration allowed for farmer, buyer, admin, and supplier
    if (role !== 'farmer' && role !== 'buyer' && role !== 'admin' && role !== 'supplier') {
      return NextResponse.json(
        { success: false, error: 'Registration is not permitted for this role.' },
        { status: 403 }
      );
    }

    let validation;
    if (role === 'farmer') {
      validation = validateFarmerRegistration(body);
    } else if (role === 'buyer') {
      validation = validateBuyerRegistration(body);
    } else if (role === 'admin') {
      validation = validateAdminRegistration(body);
    } else if (role === 'supplier') {
      validation = validateSupplierRegistration(body);
    }

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    const cleanMobile = body.mobile ? body.mobile.replace(/[\s-]/g, '').trim() : null;
    const cleanEmail = body.email ? body.email.trim().toLowerCase() : null;

    // Check duplicate mobile
    if (cleanMobile) {
      const existingMobile = getUserByMobile(cleanMobile);
      if (existingMobile) {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this mobile number already exists.',
            errors: { mobile: 'Mobile number already in use.' },
          },
          { status: 409 }
        );
      }
    }

    // Check duplicate email (if provided)
    if (cleanEmail) {
      const existingEmail = getUserByEmail(cleanEmail);
      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email address already exists.',
            errors: { email: 'Email address already in use.' },
          },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user in database
    const newUser = createUser({
      fullName: body.fullName,
      mobile: cleanMobile,
      email: cleanEmail,
      location: body.location || null,
      passwordHash,
      role,
    });

    // Create session token
    const token = signToken(newUser);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_OPTIONS.name, token, COOKIE_OPTIONS);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        mobile: newUser.mobile,
        email: newUser.email,
        location: newUser.location,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
