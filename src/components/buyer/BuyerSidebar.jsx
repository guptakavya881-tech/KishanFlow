'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WheatLogo from '@/components/WheatLogo';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Sprout,
  Search,
  Package,
  Truck,
  IndianRupee,
  Bell,
  User,
  History,
  HelpCircle,
  LogOut,
  Warehouse,
  Settings,
} from 'lucide-react';

export const BUYER_NAV_ITEMS = [
  { label: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
  { label: 'Browse Crops', href: '/buyer/browse', icon: Sprout },
  { label: 'Find Produce', href: '/buyer/find-produce', icon: Search },
  { label: 'My Orders', href: '/buyer/orders', icon: Package },
  { label: 'Track Orders', href: '/buyer/track-orders', icon: Truck },
  { label: 'Payments', href: '/buyer/payments', icon: IndianRupee },
  { label: 'Notifications', href: '/buyer/notifications', icon: Bell },
  { label: 'Profile', href: '/buyer/profile', icon: User },
  { label: 'Purchase History', href: '/buyer/purchase-history', icon: History },
  { label: 'Help & Support', href: '/buyer/help', icon: HelpCircle },
  { label: 'Settings', href: '/buyer/settings', icon: Settings },
];

export default function BuyerSidebar({ onCloseMobile }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const res = await fetch('/api/buyer/notifications?limit=1');
        const data = await res.json();
        if (data.success && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      } catch {}
    }
    loadCount();
    const timer = setInterval(loadCount, 25000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
      {/* Top Logo & Branding */}
      <div className="buyer-saas-brand-link">
        <Link
          href="/buyer/dashboard"
          onClick={onCloseMobile}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
        >
          <WheatLogo size={40} showText={false} href={null} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2rem', fontWeight: 900, lineHeight: 1.1 }}>
              <span style={{ color: '#15803d' }}>Kishan</span>
              <span style={{ color: '#d97706' }}>Flow</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#14532d', fontWeight: 700, marginTop: '2px', letterSpacing: '0.01em' }}>
              Smart Procurement • Better Tomorrow
            </span>
          </div>
        </Link>
      </div>

      {/* Section Label */}
      <div className="buyer-saas-nav-section-title">
        Procurement Hub
      </div>

      {/* Navigation Links */}
      <nav className="buyer-saas-nav-list">
        {BUYER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/buyer/dashboard' && pathname.startsWith(item.href)) ||
            (item.href === '/buyer/help' && pathname.startsWith('/buyer/support'));
          const badgeCount = item.href === '/buyer/notifications' ? unreadCount : (item.badge || 0);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`buyer-saas-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="buyer-saas-nav-left">
                <Icon
                  size={18}
                  style={{ color: isActive ? '#15803d' : '#9ca3af' }}
                />
                <span>{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span className="buyer-saas-nav-badge">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Procurement Center Quick Badge */}
      <div className="buyer-saas-mandi-badge">
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Warehouse size={16} />
        </div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 800, color: '#1f2937', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            Regional Mandi Direct
          </p>
          <p style={{ margin: 0, fontSize: '0.66rem', color: '#6b7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            Verified Quality &amp; MSP Assurance
          </p>
        </div>
      </div>

      {/* Sidebar Footer / Logout */}
      <div className="buyer-saas-sidebar-footer">
        <button
          onClick={logout}
          className="buyer-saas-nav-item"
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            color: '#dc2626',
            fontWeight: 700,
          }}
        >
          <div className="buyer-saas-nav-left">
            <LogOut size={17} style={{ color: '#ef4444' }} />
            <span>Logout</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
