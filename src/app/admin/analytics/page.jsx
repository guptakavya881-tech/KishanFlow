'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminAnalyticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/reports');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f5]">
      <Loader2 className="animate-spin text-emerald-600 mb-3" size={36} />
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Directing to Reports &amp; Analytics...
      </p>
    </div>
  );
}
