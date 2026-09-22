'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WheatLogo from '@/components/WheatLogo';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Sprout,
  Warehouse,
  Package,
  IndianRupee,
  Clock,
  Bell,
  HelpCircle,
  BarChart3,
  User,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Farmers', href: '/admin/farmers', icon: Users },
  { label: 'Buyers', href: '/admin/buyers', icon: Building2 },
  { label: 'Crop Listings', href: '/admin/crops', icon: Sprout },
  { label: 'Procurement Centres', href: '/admin/centres', icon: Warehouse },
  { label: 'Orders', href: '/admin/orders', icon: Package },
  { label: 'Payments', href: '/admin/payments', icon: IndianRupee },
  { label: 'Queue Management', href: '/admin/queue', icon: Clock },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Support', href: '/admin/support', icon: HelpCircle },
  { label: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { label: 'Profile', href: '/admin/profile', icon: User },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ onCloseMobile }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnread() {
      try {
        const res = await fetch('/api/admin/notifications?limit=1');
        const json = await res.json();
        if (json.success && typeof json.data?.unreadCount === 'number') {
          setUnreadCount(json.data.unreadCount);
        }
      } catch {}
    }
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="admin-saas-sidebar-inner">
      {/* Brand & Logo at top */}
      <div className="admin-saas-brand-link">
        <Link
          href="/admin/dashboard"
          onClick={onCloseMobile}
          className="admin-brand-container"
        >
          <WheatLogo size={38} showText={false} href={null} />
          <div className="admin-brand-text">
            <div className="admin-brand-title">
              <span className="brand-kisan">Kishan</span>
              <span className="brand-flow">Flow</span>
            </div>
            <span className="admin-portal-tag">
              Operations &amp; Oversight
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Section Title */}
      <div className="admin-nav-section-title">
        System Management
      </div>

      {/* Navigation Links */}
      <nav className="admin-saas-nav-list">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)) ||
            (item.href === '/admin/reports' && pathname.startsWith('/admin/analytics'));

          const badgeCount = item.href === '/admin/notifications' ? unreadCount : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`admin-saas-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item-left">
                <Icon
                  size={18}
                  className={`admin-nav-icon ${isActive ? 'icon-active' : ''}`}
                />
                <span>{item.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {badgeCount > 0 && (
                  <span className="admin-nav-badge">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {isActive && <div className="admin-active-dot" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Admin Authorization Pill Badge */}
      <div className="admin-sidebar-status-pill">
        <div className="admin-status-icon-wrap">
          <ShieldCheck size={16} />
        </div>
        <div className="admin-status-info">
          <p className="status-title">Admin Console</p>
          <p className="status-sub">State Level Mandi Network</p>
        </div>
      </div>

      {/* Sidebar Footer with Logout */}
      <div className="admin-saas-sidebar-footer">
        <button
          type="button"
          onClick={logout}
          className="admin-logout-btn"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
