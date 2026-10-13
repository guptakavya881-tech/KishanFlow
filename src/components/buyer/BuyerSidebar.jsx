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
import { useLanguage } from '@/context/LanguageContext';

export const BUYER_NAV_CONFIG = [
  { key: 'common.dashboard', defaultLabel: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
  { key: 'buyer.browseCrops', defaultLabel: 'Browse Crops', href: '/buyer/browse', icon: Sprout },
  { key: 'buyer.findProduce', defaultLabel: 'Find Produce', href: '/buyer/find-produce', icon: Search },
  { key: 'buyer.myOrders', defaultLabel: 'My Orders', href: '/buyer/orders', icon: Package },
  { key: 'buyer.trackOrders', defaultLabel: 'Track Orders', href: '/buyer/track-orders', icon: Truck },
  { key: 'buyer.payments', defaultLabel: 'Payments', href: '/buyer/payments', icon: IndianRupee },
  { key: 'common.notifications', defaultLabel: 'Notifications', href: '/buyer/notifications', icon: Bell },
  { key: 'common.profile', defaultLabel: 'Profile', href: '/buyer/profile', icon: User },
  { key: 'buyer.purchaseHistory', defaultLabel: 'Purchase History', href: '/buyer/purchase-history', icon: History },
  { key: 'common.helpSupport', defaultLabel: 'Help & Support', href: '/buyer/help', icon: HelpCircle },
  { key: 'common.settings', defaultLabel: 'Settings', href: '/buyer/settings', icon: Settings },
];

export const BUYER_NAV_ITEMS = BUYER_NAV_CONFIG.map(item => ({ label: item.defaultLabel, href: item.href, icon: item.icon }));

export default function BuyerSidebar({ onCloseMobile }) {
  const { t } = useLanguage();
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
        {t('buyer.procurementHub', 'Procurement Hub')}
      </div>

      {/* Navigation Links */}
      <nav className="buyer-saas-nav-list">
        {BUYER_NAV_CONFIG.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/buyer/dashboard' && pathname.startsWith(item.href)) ||
            (item.href === '/buyer/help' && pathname.startsWith('/buyer/support'));
          const badgeCount = item.href === '/buyer/notifications' ? unreadCount : 0;
          const translatedLabel = t(item.key, item.defaultLabel);

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
                <span>{translatedLabel}</span>
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
            {t('buyer.regionalMandiDirect', 'Regional Mandi Direct')}
          </p>
          <p style={{ margin: 0, fontSize: '0.66rem', color: '#6b7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {t('buyer.verifiedQualityMsp', 'Verified Quality & MSP Assurance')}
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
            <span>{t('common.logout', 'Logout')}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
