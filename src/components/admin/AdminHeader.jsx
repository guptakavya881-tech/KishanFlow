'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import {
  Bell,
  ChevronDown,
  Menu,
  X,
  User,
  Shield,
  LogOut,
  Settings,
} from 'lucide-react';

export default function AdminHeader({ onToggleMobile, mobileOpen }) {
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
    async function loadUnreadCount() {
      try {
        const res = await fetch('/api/admin/notifications?limit=1');
        const json = await res.json();
        if (json.success && typeof json.data?.unreadCount === 'number') {
          setUnreadCount(json.data.unreadCount);
        }
      } catch {
        // silent fallback
      }
    }
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminName = user?.fullName || 'System Administrator';
  const adminEmail = user?.email || 'admin@kishanflow.com';
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <header className="admin-saas-header">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="admin-header-left">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobile}
          className="admin-hamburger-btn"
          aria-label="Toggle admin navigation menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile-only brand badge */}
        <div className="admin-mobile-brand">
          <WheatLogo size={28} showText={false} href={null} />
          <div className="admin-mobile-brand-title">
            <span className="brand-kisan">Kishan</span>
            <span className="brand-flow">Flow</span>
          </div>
          <span className="admin-role-tag">Admin</span>
        </div>

        {/* Desktop Header Title */}
        <div className="admin-header-title-wrap">
          <h1 className="admin-header-title">Admin Dashboard</h1>
          <span className="admin-portal-badge">
            <Shield size={13} />
            Central Mandi Governance
          </span>
        </div>
      </div>

      {/* Right: Notifications & Authenticated Admin Info */}
      <div className="admin-header-right">
        {/* Notification Bell Icon */}
        <Link
          href="/admin/notifications"
          className="admin-header-notif-btn"
          title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="admin-notif-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="admin-header-divider" />

        {/* Dynamic Admin Profile Dropdown */}
        <div className="admin-profile-dropdown-container">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
            className="admin-profile-pill"
            aria-expanded={dropdownOpen}
          >
            {/* Avatar with initial */}
            <div className="admin-avatar">
              <span>{adminInitial}</span>
            </div>

            {/* Admin Name & Role */}
            <div className="admin-details">
              <span className="admin-name">{adminName}</span>
              <div className="admin-role-row">
                <span className="admin-badge">ADMIN</span>
                <span className="admin-verified-text">Active</span>
              </div>
            </div>

            <ChevronDown
              size={14}
              className={`admin-chevron ${dropdownOpen ? 'rotate' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="admin-dropdown-menu">
              <div className="admin-dropdown-header">
                <p className="admin-dropdown-name">{adminName}</p>
                <p className="admin-dropdown-email">{adminEmail}</p>
                <div className="admin-dropdown-role-chip">
                  <Shield size={12} />
                  <span>Authorized Administrator</span>
                </div>
              </div>

              <Link
                href="/admin/profile"
                className="admin-dropdown-item"
              >
                <User size={15} />
                <span>Admin Profile</span>
              </Link>

              <Link
                href="/admin/settings"
                className="admin-dropdown-item"
              >
                <Settings size={15} />
                <span>System Settings</span>
              </Link>

              <div className="admin-dropdown-footer">
                <button
                  type="button"
                  onClick={logout}
                  className="admin-dropdown-logout"
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
