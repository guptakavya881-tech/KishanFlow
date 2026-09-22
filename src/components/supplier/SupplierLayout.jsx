'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import SupplierSidebar from './SupplierSidebar';
import WheatLogo from '@/components/WheatLogo';
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
} from 'lucide-react';

export default function SupplierLayout({
  children,
  title = 'Supplier Dashboard',
  subtitle = 'Manage your agricultural products, inventory and farmer orders.',
}) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const supplierName = user?.fullName || 'AgriSupply Logistics Co.';
  const initial = supplierName.charAt(0).toUpperCase() || 'S';

  return (
    <ProtectedRoute allowedRoles={['supplier']}>
      <div className="supplier-saas-layout">
        {/* Desktop Sidebar */}
        <div className="supplier-saas-sidebar desktop-only">
          <SupplierSidebar />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileOpen && (
          <>
            <div
              className="supplier-mobile-overlay"
              onClick={() => setMobileOpen(false)}
            />
            <div className="supplier-mobile-drawer">
              <SupplierSidebar onCloseMobile={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        {/* Main Content Area */}
        <div className="supplier-saas-main-area">
          {/* Header */}
          <header className="supplier-saas-header">
            <div className="supplier-header-container">
              {/* Left: Mobile menu toggle or Page Title */}
              <div className="supplier-header-left">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="supplier-mobile-menu-btn"
                  style={{
                    display: 'none',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '8px',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <h1 className="supplier-header-title">{title}</h1>
                  <p className="supplier-header-subtitle">{subtitle}</p>
                </div>
              </div>

              {/* Right: Notifications & User Profile */}
              <div className="supplier-header-right">
                {/* Notification Bell */}
                <Link
                  href="/supplier/notifications"
                  className="supplier-notif-btn"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  <span className="supplier-notif-dot" />
                </Link>

                {/* Profile Pill Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="supplier-user-pill"
                  >
                    <div className="supplier-avatar-circle">{initial}</div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        marginRight: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          lineHeight: 1.15,
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {supplierName}
                      </span>
                      <span className="supplier-user-role-badge">Supplier</span>
                    </div>
                    <ChevronDown size={14} style={{ color: '#94a3b8' }} />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        style={{
                          position: 'fixed',
                          inset: 0,
                          zIndex: 45,
                        }}
                        onClick={() => setProfileOpen(false)}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          marginTop: '8px',
                          width: '220px',
                          backgroundColor: '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                          padding: '6px 0',
                          zIndex: 50,
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              color: '#0f172a',
                            }}
                          >
                            {supplierName}
                          </p>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: '0.72rem',
                              color: '#64748b',
                            }}
                          >
                            {user?.email || 'supplier@kishanflow.com'}
                          </p>
                        </div>

                        <Link
                          href="/supplier/settings"
                          onClick={() => setProfileOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#334155',
                            textDecoration: 'none',
                          }}
                        >
                          <Settings size={15} style={{ color: '#64748b' }} />
                          <span>Settings</span>
                        </Link>

                        <Link
                          href="/supplier/support"
                          onClick={() => setProfileOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 16px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#334155',
                            textDecoration: 'none',
                          }}
                        >
                          <HelpCircle size={15} style={{ color: '#64748b' }} />
                          <span>Help &amp; Support</span>
                        </Link>

                        <div
                          style={{
                            borderTop: '1px solid #f1f5f9',
                            marginTop: '4px',
                            paddingTop: '4px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setProfileOpen(false);
                              logout();
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 16px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              color: '#dc2626',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <LogOut size={15} style={{ color: '#dc2626' }} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
