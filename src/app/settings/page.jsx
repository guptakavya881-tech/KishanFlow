'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function SettingsRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/farmer/login');
        return;
      }

      const role = String(user.role || '').toLowerCase();
      if (role === 'admin') {
        router.replace('/admin/settings');
      } else if (role === 'buyer') {
        router.replace('/buyer/settings');
      } else if (role === 'supplier') {
        router.replace('/supplier/settings');
      } else {
        router.replace('/farmer/settings');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f5]">
      <Loader2 className="animate-spin text-emerald-600 mb-3" size={36} />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Directing to your account settings...
      </p>
    </div>
  );
}
