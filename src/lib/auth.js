import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getUserById } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kishan-flow-super-secure-jwt-secret-farm-to-future-2026';
export const AUTH_COOKIE_NAME = 'kishan_auth_token';

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      email: user.email || null,
      mobile: user.mobile || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return null;

    const user = getUserById(decoded.id);
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      location: user.location,
      companyName: user.companyName || null,
      businessType: user.businessType || null,
      gstin: user.gstin || null,
      accountStatus: user.accountStatus || 'Active',
      role: user.role,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export const COOKIE_OPTIONS = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};
