'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SettingsModule from '@/components/common/SettingsModule';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="admin-saas-content">
        <SettingsModule roleTitle="Administrator" roleColor="#15803d" />
      </div>
    </AdminLayout>
  );
}
