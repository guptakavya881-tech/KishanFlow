'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import WheatLogo from './WheatLogo';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const rolesArray = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
    .map((r) => String(r || '').trim().toLowerCase());

  useEffect(() => {
    if (!loading && !user) {
      // Direct user to the appropriate login page based on required role
      const defaultRole = rolesArray[0] || 'farmer';
      router.push(`/${defaultRole}/login`);
    }
  }, [user, loading, router, rolesArray]);

  if (loading) {
    return (
      <div className="min-h-screen flex-center flex-col gap-4 bg-cream">
        <div className="animate-spin-slow">
          <WheatLogo size={56} />
        </div>
        <p className="text-secondary font-medium animate-pulse">
          Verifying KishanFlow credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const userRole = String(user.role || '').trim().toLowerCase();
  if (!rolesArray.includes(userRole)) {
    return (
      <div className="min-h-screen flex-center bg-cream p-4">
        <div className="auth-card max-w-md text-center p-8 border border-red-200">
          <div className="w-16 h-16 rounded-full bg-red-100 flex-center mx-auto mb-4 text-red-600">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-dark mb-2">Access Restricted</h2>
          <p className="text-secondary mb-6 text-sm">
            You are currently signed in as a <span className="font-semibold capitalize text-primary">{user.role}</span>.
            This area requires <span className="font-semibold capitalize text-accent">{rolesArray.join(' or ')}</span> authorization.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/${user.role}/dashboard`}
              className="btn btn-primary flex-center gap-2"
            >
              <ArrowLeft size={16} /> Go to My {user.role.toUpperCase()} Dashboard
            </Link>
            <button
              onClick={logout}
              className="btn btn-outline flex-center gap-2 text-danger border-danger"
            >
              <LogOut size={16} /> Logout and Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
