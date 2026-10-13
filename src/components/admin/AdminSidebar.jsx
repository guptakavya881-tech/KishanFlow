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
import { useLanguage } from '@/context/LanguageContext';

export const ADMIN_NAV_CONFIG = [
  { key: 'common.dashboard', defaultLabel: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'admin.farmers', defaultLabel: 'Farmers', href: '/admin/farmers', icon: Users },
  { key: 'admin.buyers', defaultLabel: 'Buyers', href: '/admin/buyers', icon: Building2 },
  { key: 'admin.cropListings', defaultLabel: 'Crop Listings', href: '/admin/crops', icon: Sprout },
  { key: 'admin.centres', defaultLabel: 'Procurement Centres', href: '/admin/centres', icon: Warehouse },
  { key: 'admin.orders', defaultLabel: 'Orders', href: '/admin/orders', icon: Package },
  { key: 'admin.payments', defaultLabel: 'Payments', href: '/admin/payments', icon: IndianRupee },
  { key: 'admin.queueManagement', defaultLabel: 'Queue Management', href: '/admin/queue', icon: Clock },
  { key: 'common.notifications', defaultLabel: 'Notifications', href: '/admin/notifications', icon: Bell },
  { key: 'common.helpSupport', defaultLabel: 'Support', href: '/admin/support', icon: HelpCircle },
  { key: 'admin.reports', defaultLabel: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { key: 'common.profile', defaultLabel: 'Profile', href: '/admin/profile', icon: User },
  { key: 'common.settings', defaultLabel: 'Settings', href: '/admin/settings', icon: Settings },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAV_CONFIG.map(item => ({ label: item.defaultLabel, href: item.href, icon: item.icon }));

export default function AdminSidebar({ onCloseMobile }) {
  const { t } = useLanguage();
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
              {t('admin.portalTitle', 'Operations & Oversight')}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Section Title */}
      <div className="admin-nav-section-title">
        {t('admin.systemManagement', 'System Management')}
      </div>

      {/* Navigation Links */}
      <nav className="admin-saas-nav-list">
        {ADMIN_NAV_CONFIG.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href)) ||
            (item.href === '/admin/reports' && pathname.startsWith('/admin/analytics'));

          const badgeCount = item.href === '/admin/notifications' ? unreadCount : 0;
          const translatedLabel = t(item.key, item.defaultLabel);

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
                <span>{translatedLabel}</span>
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
          <p className="status-sub">{t('admin.stateLevelMandi', 'State Level Mandi Network')}</p>
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
          <span>{t('common.logout', 'Logout')}</span>
        </button>
      </div>
    </aside>
  );
}
