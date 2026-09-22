'use client';

import React from 'react';
import Link from 'next/link';
import WheatLogo from '@/components/WheatLogo';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex-center flex-col p-6 text-center">
      <WheatLogo size={56} />
      <h1 className="text-4xl font-extrabold text-dark mt-4 mb-2">404</h1>
      <h2 className="text-xl font-bold text-green-700 mb-2">Page Not Found</h2>
      <p className="text-secondary max-w-md mb-6 text-sm">
        The agricultural page or portal you are looking for does not exist or has been relocated.
      </p>
      <Link href="/" className="btn btn-primary flex items-center gap-2">
        <Home size={18} /> Return to Homepage
      </Link>
    </div>
  );
}
