'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import { SidebarTractorFooter } from '@/components/farmer/FarmIllustrations';
import {
  Home,
  Sprout,
  CalendarCheck,
  Users,
  ClipboardList,
  IndianRupee,
  Bell,
  User,
  Headphones,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Tractor,
  Package,
  Settings,
  Search,
} from 'lucide-react';

export default function FarmerLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarError, setAvatarError] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch real unread notification count
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/farmer/notifications');
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchUnread();
  }, [pathname]);

  useEffect(() => {
    // Close dropdown on outside click
    const handleOutside = () => setProfileDropdownOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/farmer/dashboard', icon: Home },
    { label: 'My Farm', href: '/farmer/dashboard#my-farm', icon: Tractor },
    { label: 'Crops', href: '/farmer/crops', icon: Sprout },
    { label: 'Orders', href: '/farmer/orders', icon: Package },
    { label: 'Supplier Inputs', href: '/farmer/supplier-orders', icon: Package },
    { label: 'Procurement', href: '/farmer/procurement', icon: ClipboardList },
    { label: 'Bookings', href: '/farmer/bookings', icon: CalendarCheck },
    { label: 'Live Queue', href: '/farmer/queue', icon: Users },
    { label: 'Payments', href: '/farmer/payments', icon: IndianRupee },
    { label: 'Notifications', href: '/farmer/notifications', icon: Bell, badge: unreadCount },
    { label: 'Profile', href: '/farmer/profile', icon: User },
    { label: 'Settings', href: '/farmer/settings', icon: Settings },
  ];

  const displayName = user?.fullName || 'Farmer';

  // Resolved Page Title and Subtitle for Header
  const resolvedTitle =
    title ||
    (pathname.startsWith('/farmer/supplier-orders')
      ? 'Supplier Inputs'
      : pathname.startsWith('/farmer/orders')
      ? 'Crop Orders'
      : pathname.startsWith('/farmer/crops')
      ? 'My Crops'
      : pathname.startsWith('/farmer/bookings')
      ? 'My Bookings'
      : pathname.startsWith('/farmer/procurement')
      ? 'Procurement'
      : pathname.startsWith('/farmer/queue')
      ? 'Live Queue'
      : pathname.startsWith('/farmer/payments')
      ? 'Payments'
      : pathname.startsWith('/farmer/profile')
      ? 'My Profile'
      : pathname.startsWith('/farmer/settings')
      ? 'Settings'
      : (pathname.startsWith('/farmer/help') || pathname.startsWith('/farmer/support'))
      ? 'Help & Support'
      : 'Farmer Portal');

  const resolvedSubtitle =
    subtitle ||
    (pathname.startsWith('/farmer/supplier-orders')
      ? 'Order agricultural inputs directly from verified suppliers.'
      : pathname.startsWith('/farmer/orders')
      ? 'Manage buyer crop purchase requests & order fulfillment.'
      : pathname.startsWith('/farmer/settings')
      ? 'Manage your account and preferences.'
      : (pathname.startsWith('/farmer/help') || pathname.startsWith('/farmer/support'))
      ? 'Find answers or get help with your KishanFlow journey.'
      : 'From Farm to Future — KishanFlow');

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <div className="farmer-saas-layout">
        {/* Fixed Desktop Sidebar */}
        <aside className="farmer-saas-sidebar desktop-only" style={{ overflowY: 'auto' }}>
          {/* Top Logo Branding */}
          <Link href="/farmer/dashboard" className="farmer-saas-sidebar-brand">
            <WheatLogo size={36} showText={false} href={null} />
            <div className="farmer-brand-text">
              <div className="farmer-brand-title">
                <span className="farmer-brand-kisan">Kishan</span>
                <span className="farmer-brand-flow">Flow</span>
              </div>
              <span className="farmer-brand-tagline">
                From Farm to Future
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ flex: 1, padding: '12px 0' }}>
            <ul className="farmer-saas-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/farmer/dashboard' && pathname.startsWith(item.href));

                const badgeCount = item.label === 'Notifications' ? unreadCount : item.badge;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`farmer-saas-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </div>
                      {badgeCount > 0 && (
                        <span className="farmer-nav-badge">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Bottom Actions */}
          <div className="farmer-saas-sidebar-footer">
            <Link
              href="/farmer/help"
              className={`farmer-sidebar-footer-link ${
                pathname.startsWith('/farmer/help') || pathname.startsWith('/farmer/support') ? 'active' : ''
              }`}
            >
              <Headphones size={18} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>Help & Support</span>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 500 }}>Need help? We're here.</span>
              </div>
            </Link>

            <button
              onClick={logout}
              className="farmer-sidebar-footer-link logout"
            >
              <LogOut size={18} style={{ flexShrink: 0 }} />
              <span>Logout</span>
            </button>
          </div>

          {/* Scenic Tractor Landscape Footer */}
          <SidebarTractorFooter />
        </aside>

        {/* Main Column (Header + Page Content) */}
        <div className="farmer-saas-main-area">
          {/* Top Header Bar */}
          <header className="farmer-saas-header">
            {/* Left Header Title / Mobile Toggle */}
            <div className="farmer-header-left">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="farmer-mobile-toggle-btn"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="farmer-header-title-box">
                <h1 className="farmer-header-title">{resolvedTitle}</h1>
                <p className="farmer-header-subtitle">{resolvedSubtitle}</p>
              </div>
            </div>

            {/* Desktop Header Search - Compact and properly sized */}
            <div className="farmer-header-search-wrap">
              <div className="farmer-header-search-icon">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search inputs, seeds, fertilizers..."
                className="farmer-header-search-input"
              />
            </div>

            {/* Right Header Area: Notifications Bell & Farmer Avatar */}
            <div className="farmer-header-right">
              {/* Notification Bell with Badge */}
              <Link
                href="/farmer/notifications"
                className="farmer-header-notif-btn"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="farmer-header-notif-badge">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Farmer Profile Pill + Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className="farmer-header-user-btn"
                >
                  <div className="farmer-header-avatar">
                    {!avatarError ? (
                      <Image
                        src="/images/avatar_farmer.jpg"
                        alt={displayName}
                        width={32}
                        height={32}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <span>{displayName.charAt(0)}</span>
                    )}
                  </div>

                  <div className="farmer-header-user-info">
                    <span className="farmer-header-user-name">
                      {displayName}
                    </span>
                    <span className="farmer-header-user-role">Farmer</span>
                  </div>

                  <ChevronDown size={14} style={{ color: '#94a3b8', marginLeft: '2px' }} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="farmer-header-dropdown">
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{displayName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#64748b' }}>{user?.email || 'farmer@kishanflow.com'}</p>
                    </div>
                    <Link
                      href="/farmer/profile"
                      className="farmer-dropdown-item"
                    >
                      <User size={15} style={{ color: '#94a3b8' }} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/farmer/bookings"
                      className="farmer-dropdown-item"
                    >
                      <CalendarCheck size={15} style={{ color: '#94a3b8' }} />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      href="/farmer/help"
                      className="farmer-dropdown-item"
                    >
                      <Headphones size={15} style={{ color: '#94a3b8' }} />
                      <span>Help & Support</span>
                    </Link>
                    <Link
                      href="/farmer/settings"
                      className="farmer-dropdown-item"
                    >
                      <Settings size={15} style={{ color: '#94a3b8' }} />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="farmer-dropdown-item logout"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <>
              <div
                className="farmer-drawer-backdrop"
                onClick={() => setMobileMenuOpen(false)}
              />
              <aside className="farmer-drawer">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <WheatLogo size={28} showText={false} href={null} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                      <span style={{ color: '#15803d' }}>Kishan</span>
                      <span style={{ color: '#d97706' }}>Flow</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', padding: '6px', cursor: 'pointer', borderRadius: '8px' }}
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
                  <ul className="farmer-saas-nav-list">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/farmer/dashboard' && pathname.startsWith(item.href));

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`farmer-saas-nav-item ${isActive ? 'active' : ''}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Icon size={18} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge > 0 && (
                              <span className="farmer-nav-badge">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="farmer-saas-sidebar-footer">
                  <Link
                    href="/farmer/help"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`farmer-sidebar-footer-link ${
                      pathname.startsWith('/farmer/help') || pathname.startsWith('/farmer/support') ? 'active' : ''
                    }`}
                  >
                    <Headphones size={18} style={{ color: '#94a3b8' }} />
                    <span>Help & Support</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="farmer-sidebar-footer-link logout"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </aside>
            </>
          )}

          {/* Main Dashboard Content */}
          <main className="farmer-saas-content">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

