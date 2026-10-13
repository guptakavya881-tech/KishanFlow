'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WheatLogo from '@/components/WheatLogo';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  X,
  Truck,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const SUPPLIER_NAV_CONFIG = [
  { key: 'common.dashboard', defaultLabel: 'Dashboard', href: '/supplier/dashboard', icon: LayoutDashboard },
  { key: 'supplier.products', defaultLabel: 'Products', href: '/supplier/products', icon: Package },
  { key: 'supplier.orders', defaultLabel: 'Orders', href: '/supplier/orders', icon: ShoppingBag },
  { key: 'supplier.inventory', defaultLabel: 'Inventory', href: '/supplier/inventory', icon: Boxes },
  { key: 'common.notifications', defaultLabel: 'Notifications', href: '/supplier/notifications', icon: Bell },
  { key: 'common.helpSupport', defaultLabel: 'Help & Support', href: '/supplier/support', icon: HelpCircle },
  { key: 'common.settings', defaultLabel: 'Settings', href: '/supplier/settings', icon: Settings },
];

export const SUPPLIER_NAV_ITEMS = SUPPLIER_NAV_CONFIG.map(item => ({ label: item.defaultLabel, href: item.href, icon: item.icon }));

export default function SupplierSidebar({ onCloseMobile }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="supplier-saas-sidebar">
      {/* Top Logo and Branding */}
      <div className="supplier-saas-brand-wrap">
        <Link
          href="/supplier/dashboard"
          onClick={onCloseMobile}
          className="supplier-brand-link"
        >
          <WheatLogo size={36} showText={false} href={null} />
          <div className="supplier-brand-text">
            <div className="supplier-brand-title">
              <span className="supplier-brand-kisan">Kishan</span>
              <span className="supplier-brand-flow">Flow</span>
            </div>
            <span className="supplier-brand-tagline">{t('common.brandTagline', 'From Farm to Future')}</span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Supplier Section Header */}
      <div className="supplier-hub-tag">
        {t('supplier.portalTitle', 'Input & Logistics Hub')}
      </div>

      {/* Navigation Links */}
      <nav className="supplier-saas-nav-list">
        {SUPPLIER_NAV_CONFIG.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/supplier/dashboard' && pathname.startsWith(item.href)) ||
            (item.key === 'common.helpSupport' && pathname.startsWith('/supplier/help'));
          const translatedLabel = t(item.key, item.defaultLabel);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`supplier-saas-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{translatedLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Supplier Profile & Sign Out at Bottom */}
      <div className="supplier-sidebar-bottom">
        <div className="supplier-profile-badge-card">
          <div className="supplier-profile-icon">
            <Truck size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#78350f', lineHeight: 1.2 }}>
              {t('supplier.directSupplier', 'Direct Supplier')}
            </p>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 600, color: '#b45309', marginTop: '2px' }}>
              {t('supplier.inputsGear', 'Inputs & Farm Gear')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="supplier-logout-btn"
        >
          <LogOut size={16} />
          <span>{t('common.signOut', 'Sign Out')}</span>
        </button>
      </div>
    </aside>
  );
}
