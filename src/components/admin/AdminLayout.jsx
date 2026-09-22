'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminBackground from '@/components/admin/AdminBackground';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="admin-saas-layout">
        {/* Soft Ambient Agricultural Background */}
        <AdminBackground />

        {/* Desktop Fixed Sidebar */}
        <div className="admin-saas-sidebar desktop-only">
          <AdminSidebar />
        </div>

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div className="admin-mobile-drawer-overlay">
            {/* Backdrop click to close */}
            <div
              className="admin-drawer-backdrop"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Container */}
            <div className="admin-mobile-drawer">
              <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Column (Header + Page Content) */}
        <div className="admin-saas-main-area">
          <AdminHeader
            onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
            mobileOpen={mobileMenuOpen}
          />

          {/* Page Content Viewport */}
          <main className="admin-saas-content">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
