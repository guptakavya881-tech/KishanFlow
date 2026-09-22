'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToAddCrop() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/farmer/add-crop');
  }, [router]);

  return null;
}
