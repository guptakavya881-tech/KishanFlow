'use client';

import React from 'react';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import SettingsModule from '@/components/common/SettingsModule';

export default function BuyerSettingsPage() {
  return (
    <BuyerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '8px 4px 32px' }}>
        <SettingsModule roleTitle="Buyer" roleColor="#15803d" />
      </div>
    </BuyerLayout>
  );
}
