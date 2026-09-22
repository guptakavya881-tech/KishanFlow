'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BuyerBackground from '@/components/buyer/BuyerBackground';
import BuyerSidebar from '@/components/buyer/BuyerSidebar';
import BuyerHeader from '@/components/buyer/BuyerHeader';

export default function BuyerLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      <div className="buyer-saas-layout">
        {/* Soft Ambient Agricultural Background */}
        <BuyerBackground />

        {/* Desktop Fixed Sidebar */}
        <div className="buyer-saas-sidebar desktop-only">
          <BuyerSidebar />
        </div>

        {/* Mobile Slide-Over Drawer */}
        {mobileMenuOpen && (
          <div className="buyer-mobile-drawer-overlay">
            {/* Backdrop click to close */}
            <div
              style={{ position: 'absolute', inset: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div className="buyer-mobile-drawer">
              <BuyerSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Column (Header + Page Content) */}
        <div className="buyer-saas-main-area">
          <BuyerHeader
            onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
            mobileOpen={mobileMenuOpen}
          />

          {/* Page Content Viewport */}
          <main className="buyer-saas-content">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
