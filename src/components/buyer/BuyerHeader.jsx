'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_BUYER_PROFILE } from '@/data/buyerMockData';
import WheatLogo from '@/components/WheatLogo';
import {
  Bell,
  ChevronDown,
  Menu,
  X,
  User,
  Package,
  HelpCircle,
  LogOut,
  Building2,
} from 'lucide-react';

export default function BuyerHeader({ onToggleMobile, mobileOpen }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = () => setDropdownOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Fetch real unread notification count
  useEffect(() => {
    async function loadNotifCount() {
      try {
        const res = await fetch('/api/buyer/notifications?limit=1');
        const data = await res.json();
        if (data.success && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        // silent fail
      }
    }
    loadNotifCount();
    const interval = setInterval(loadNotifCount, 25000);
    return () => clearInterval(interval);
  }, [user]);

  const companyName = user?.companyName || user?.fullName || DEFAULT_BUYER_PROFILE.companyName;
  const buyerId = user?.id ? `KF-BUYER-${String(user.id).padStart(4, '0')}` : DEFAULT_BUYER_PROFILE.buyerId;

  return (
    <header className="buyer-saas-header">
      {/* Left: Mobile Menu Toggle & Brand / Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onToggleMobile}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: '#4b5563',
          }}
          className="lg-hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile brand text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="lg-hidden">
          <WheatLogo size={30} showText={false} href={null} />
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.05rem', fontWeight: 900 }}>
            <span style={{ color: '#15803d' }}>Kishan</span>
            <span style={{ color: '#d97706' }}>Flow</span>
          </div>
          <span style={{
            fontSize: '0.65rem',
            backgroundColor: '#dcfce7',
            color: '#14532d',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            marginLeft: '4px',
          }}>
            Buyer
          </span>
        </div>

        {/* Desktop Portal Badge */}
        <div style={{ display: 'none' }} className="hidden lg:flex" id="desktop-portal-badge">
          <span style={{
            color: '#15803d',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '5px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            fontSize: '0.78rem',
          }}>
            <Building2 size={14} />
            Institutional Procurement Portal
          </span>
        </div>
      </div>

      {/* Right Header Area: Notifications & Buyer Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notification Bell with Badge */}
        <Link
          href="/buyer/notifications"
          style={{
            position: 'relative',
            padding: '8px',
            borderRadius: '50%',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
          title="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              borderRadius: '9999px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Vertical Divider */}
        <div style={{ height: '24px', width: '1px', backgroundColor: '#e5e7eb' }} />

        {/* Buyer Profile Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 8px',
              borderRadius: '12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
            }}
            aria-expanded={dropdownOpen}
          >
            {/* Buyer Avatar */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#15803d',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(21, 128, 61, 0.2)',
              border: '2px solid #bbf7d0',
              flexShrink: 0,
            }}>
              <span>{companyName.charAt(0)}</span>
            </div>

            {/* Buyer Details */}
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                {companyName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 800, backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                  Buyer
                </span>
                <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600 }}>
                  {buyerId}
                </span>
              </div>
            </div>

            <ChevronDown
              size={14}
              style={{
                color: '#9ca3af',
                marginLeft: '2px',
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '210px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              border: '1.5px solid #e5e7eb',
              padding: '6px 0',
              zIndex: 50,
            }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#111827' }}>{companyName}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#6b7280' }}>{buyerId}</p>
              </div>

              <Link
                href="/buyer/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                <User size={15} style={{ color: '#9ca3af' }} />
                <span>Buyer Profile</span>
              </Link>

              <Link
                href="/buyer/orders"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                <Package size={15} style={{ color: '#9ca3af' }} />
                <span>My Orders</span>
              </Link>

              <Link
                href="/buyer/help"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                <HelpCircle size={15} style={{ color: '#9ca3af' }} />
                <span>Help &amp; Support</span>
              </Link>

              <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={logout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
