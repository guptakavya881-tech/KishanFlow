'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from './WheatLogo';
import { Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <WheatLogo size={38} showText={true} />
        </div>

        {/* Desktop Nav Links */}
        <nav className="navbar-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {link.name}
                {isActive && <span className="active-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Tagline or Auth profile */}
        <div className="navbar-right">
          {user ? (
            <div className="navbar-user-bar">
              <Link
                href={`/${user.role}/dashboard`}
                className="user-pill-btn"
                title="Go to dashboard"
              >
                <div className="user-avatar-mini">
                  <User size={14} />
                </div>
                <span className="user-name-text">{user.fullName}</span>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
              </Link>
              <button
                onClick={logout}
                className="logout-icon-btn"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="navbar-tagline-motto">
              <span>Better Farmers</span>
              <span className="dot-sep">|</span>
              <span>Better Food</span>
              <span className="dot-sep">|</span>
              <span>A Stronger Tomorrow</span>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <nav className="mobile-nav">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="mobile-user-section">
                <Link
                  href={`/${user.role}/dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-dashboard-link"
                >
                  <LayoutDashboard size={18} />
                  <span>My {user.role.toUpperCase()} Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="mobile-logout-btn"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="mobile-roles-list">
                <p className="mobile-roles-title">Login Portals:</p>
                <div className="mobile-roles-grid">
                  <Link href="/farmer/login" onClick={() => setMobileMenuOpen(false)} className="mobile-role-item green">Farmer</Link>
                  <Link href="/buyer/login" onClick={() => setMobileMenuOpen(false)} className="mobile-role-item blue">Buyer</Link>
                  <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="mobile-role-item purple">Admin</Link>
                  <Link href="/supplier/login" onClick={() => setMobileMenuOpen(false)} className="mobile-role-item orange">Supplier</Link>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
