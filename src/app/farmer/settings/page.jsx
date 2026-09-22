'use client';

import React from 'react';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import SettingsModule from '@/components/common/SettingsModule';

export default function FarmerSettingsPage() {
  return (
    <FarmerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '16px 8px 48px' }}>
        <SettingsModule roleTitle="Farmer" roleColor="#15803d" />
      </div>
    </FarmerLayout>
  );
}
