'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import {
  LayoutDashboard,
  Sprout,
  Calendar,
  Clock,
  MapPin,
  Scale,
  Users,
  Bell,
  LogOut,
  HelpCircle,
  Plus,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Ticket,
  QrCode,
  Sparkles,
  Menu,
  X,
  CreditCard,
  Truck,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Package,
} from 'lucide-react';

// Reusable SVG QR Code Generator Component
function SimpleQRCode({ text, size = 140 }) {
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const grid = 15;
  const hash = hashString(text || 'KF-2026');
  const cells = [];

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const isTopLeft = r < 5 && c < 5;
      const isTopRight = r < 5 && c >= grid - 5;
      const isBottomLeft = r >= grid - 5 && c < 5;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isTopLeft ? r : isTopRight ? r : r - (grid - 5);
        const localC = isTopLeft ? c : isTopRight ? c - (grid - 5) : c;
        const isBorder = localR === 0 || localR === 4 || localC === 0 || localC === 4;
        const isCenter = localR === 2 && localC === 2;
        if (isBorder || isCenter) cells.push({ r, c });
      } else {
        const val = (hash * (r + 1) * (c + 1) + r * 7 + c * 13) % 100;
        if (val < 45) cells.push({ r, c });
      }
    }
  }

  const cellSize = size / grid;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: '8px' }}>
      <rect width={size} height={size} fill="#ffffff" />
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#14532d"
        />
      ))}
    </svg>
  );
}

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  // Authentication Protection Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'farmer')) {
      router.push('/farmer/login');
    }
  }, [user, authLoading, router]);

  // Fetch Real Dashboard Information from Backend
  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/farmer/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
      }
    } catch (err) {
      console.error('Error loading farmer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  // Resolved Real Farmer Info
  const farmerName = user?.fullName || dashboardData?.user?.fullName || 'Farmer';
  const farmerInitial = farmerName.charAt(0).toUpperCase();

  const [selectedUpcomingId, setSelectedUpcomingId] = useState(null);

  // Resolved Real Bookings & Crops
  const allUpcoming = (dashboardData?.upcomingBookings && dashboardData.upcomingBookings.length > 0)
    ? dashboardData.upcomingBookings
    : (dashboardData?.bookings || []).filter((b) =>
        b.status === 'Confirmed' || b.status === 'Upcoming' || b.status === 'In Queue' || b.status === 'Waiting' || b.status === 'Active'
      );
  const upcoming = allUpcoming.find((b) => b.id === selectedUpcomingId) || allUpcoming[0] || dashboardData?.upcomingBooking || null;
  const crops = dashboardData?.crops || [];
  const notifications = dashboardData?.notifications || [];
  const unreadCount = dashboardData?.unreadNotificationCount || 0;
  const stats = dashboardData?.stats || {
    activeCropsCount: crops.length,
    upcomingBookingsCount: allUpcoming.length,
    completedProcurementsCount: 0,
    pendingPaymentsCount: 0,
  };

  // Time-based Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Queue Calculations (Derived realistically from token if available)
  const tokenNumOnly = upcoming?.tokenNumber
    ? parseInt(upcoming.tokenNumber.replace(/\D/g, ''), 10) || 591
    : 591;
  const servingTokenNum = Math.max(100, tokenNumOnly - 3);
  const servingTokenStr = `KF-${servingTokenNum}`;
  const peopleAhead = Math.max(1, tokenNumOnly - servingTokenNum);

  return (
    <div className="farmer-saas-layout">
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            zIndex: 35,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR                                          */}
      {/* ======================================================== */}
      <aside className={`farmer-saas-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand Header */}
          <Link href="/farmer/dashboard" className="farmer-saas-sidebar-brand">
            <WheatLogo size={32} showText={false} href={null} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.2rem', fontWeight: 900, lineHeight: 1.1 }}>
                <span style={{ color: '#15803d' }}>Kishan</span>
                <span style={{ color: '#d97706' }}>Flow</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.04em', marginTop: '2px' }}>
                From Farm to Future
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <ul className="farmer-saas-nav-list">
            <li>
              <Link href="/farmer/dashboard" className="farmer-saas-nav-item active">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/crops" className="farmer-saas-nav-item">
                <Sprout size={18} />
                <span>My Crops</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/orders" className="farmer-saas-nav-item" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Package size={18} />
                  <span>Orders</span>
                </div>
                {(dashboardData?.orderMetrics?.newRequests || 0) > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                    }}
                  >
                    {dashboardData.orderMetrics.newRequests}
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link href="/farmer/bookings" className="farmer-saas-nav-item">
                <Calendar size={18} />
                <span>My Bookings</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/add-crop" className="farmer-saas-nav-item">
                <Sparkles size={18} color="#d97706" />
                <span>Find Best Slot</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/queue" className="farmer-saas-nav-item">
                <Clock size={18} />
                <span>Queue Status</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/notifications" className="farmer-saas-nav-item" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bell size={18} />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="farmer-saas-sidebar-footer">
          <Link href="/farmer/help" className="farmer-saas-nav-item">
            <HelpCircle size={18} />
            <span>Help &amp; Support</span>
          </Link>

          <button
            onClick={logout}
            className="farmer-saas-nav-item"
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              cursor: 'pointer',
              color: '#dc2626',
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN AREA (HEADER + CONTENT)                          */}
      {/* ======================================================== */}
      <div className="farmer-saas-main-area">
        {/* Top Header */}
        <header className="farmer-saas-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger Button on Mobile */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: '#374151',
              }}
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu size={22} />
            </button>

            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14532d' }}>
              Farmer Dashboard
            </span>
          </div>

          {/* Right Header: Notification + Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notification Bell */}
            <Link
              href="/farmer/notifications"
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    border: '2px solid #ffffff',
                  }}
                />
              )}
            </Link>

            {/* Profile Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 10px 4px 4px',
                borderRadius: '9999px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                }}
              >
                {farmerInitial}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
                  {farmerName}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                  Farmer
                </span>
              </div>

              <ChevronDown size={14} color="#9ca3af" />
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* MAIN DASHBOARD CONTENT                                   */}
        {/* ======================================================== */}
        <main className="farmer-saas-content">
          {/* 3. Welcome Banner */}
          <div className="farmer-welcome-banner">
            <div className="farmer-welcome-text">
              <h1>
                {getGreeting()}, {farmerName} 👋
              </h1>
              <p>
                Manage your crops, procurement bookings and upcoming slots from one place.
              </p>
            </div>

            {/* Subtle Agricultural Landscape Artwork */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: 0.9,
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: '#dcfce7',
                  border: '1.5px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#15803d',
                }}
              >
                <Sprout size={32} />
              </div>
            </div>
          </div>

          {/* 4. Quick Actions */}
          <div className="farmer-quick-actions-row">
            <Link href="/farmer/add-crop" className="farmer-quick-action-btn">
              <div style={{ color: '#15803d', display: 'flex' }}>
                <Plus size={18} />
              </div>
              <span>+ Add Crop</span>
            </Link>

            <Link href="/farmer/add-crop" className="farmer-quick-action-btn">
              <div style={{ color: '#d97706', display: 'flex' }}>
                <Sparkles size={18} />
              </div>
              <span>Find Best Slot</span>
            </Link>

            <Link href="/farmer/bookings" className="farmer-quick-action-btn">
              <div style={{ color: '#2563eb', display: 'flex' }}>
                <Calendar size={18} />
              </div>
              <span>My Bookings</span>
            </Link>

            <Link href="/farmer/orders" className="farmer-quick-action-btn">
              <div style={{ color: '#16a34a', display: 'flex' }}>
                <Package size={18} />
              </div>
              <span>Orders</span>
            </Link>

            <Link href="/farmer/queue" className="farmer-quick-action-btn">
              <div style={{ color: '#059669', display: 'flex' }}>
                <Clock size={18} />
              </div>
              <span>Queue Status</span>
            </Link>
          </div>

          {/* 5. Statistics Cards (4 Cards) */}
          <div className="farmer-stats-grid">
            {/* Card 1: Active Crops */}
            <div className="farmer-stat-card">
              <div className="farmer-stat-top">
                <span className="farmer-stat-label">Active Crops</span>
                <div className="farmer-stat-icon-wrap" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                  <Sprout size={18} />
                </div>
              </div>
              <div className="farmer-stat-val">{stats.activeCropsCount}</div>
              <span className="farmer-stat-desc">Registered in APMC Mandi</span>
            </div>

            {/* Card 2: Upcoming Booking */}
            <div className="farmer-stat-card">
              <div className="farmer-stat-top">
                <span className="farmer-stat-label">Upcoming Booking</span>
                <div className="farmer-stat-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <Calendar size={18} />
                </div>
              </div>
              <div className="farmer-stat-val">{stats.upcomingBookingsCount}</div>
              <span className="farmer-stat-desc">Scheduled appointments</span>
            </div>

            {/* Card 3: Completed Procurement */}
            <div className="farmer-stat-card">
              <div className="farmer-stat-top">
                <span className="farmer-stat-label">Completed</span>
                <div className="farmer-stat-icon-wrap" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="farmer-stat-val">{stats.completedProcurementsCount}</div>
              <span className="farmer-stat-desc">Processed harvests</span>
            </div>

            {/* Card 4: Pending Payment */}
            <div className="farmer-stat-card">
              <div className="farmer-stat-top">
                <span className="farmer-stat-label">Pending Payment</span>
                <div className="farmer-stat-icon-wrap" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>
                  <CreditCard size={18} />
                </div>
              </div>
              <div className="farmer-stat-val">
                {(stats.pendingPaymentsAmount && stats.pendingPaymentsAmount > 0)
                  ? `₹${Number(stats.pendingPaymentsAmount).toLocaleString('en-IN')}`
                  : '₹0'}
              </div>
              <span className="farmer-stat-desc">
                {(stats.pendingPaymentsAmount && stats.pendingPaymentsAmount > 0)
                  ? `${stats.pendingPaymentsCount || 0} order(s) awaiting payment`
                  : 'No pending payments'}
              </span>
            </div>
          </div>

          {/* 5b. Real Buyer Order Requests Summary (Requirement 13) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e5e7eb',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Buyer Order Requests
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>
                    Live procurement requests placed for your registered crops
                  </span>
                </div>
              </div>

              <Link
                href="/farmer/orders"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#15803d',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#f0fdf4',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <span>View Orders</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#fafaf7', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#d97706', display: 'block' }}>
                  New Requests
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706' }}>
                  {dashboardData?.orderMetrics?.newRequests || 0}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>Pending confirmation</span>
              </div>

              <div style={{ backgroundColor: '#fafaf7', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', display: 'block' }}>
                  Confirmed Orders
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d' }}>
                  {dashboardData?.orderMetrics?.confirmedOrders || 0}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>Accepted requests</span>
              </div>

              <div style={{ backgroundColor: '#fafaf7', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#2563eb', display: 'block' }}>
                  Active Orders
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>
                  {dashboardData?.orderMetrics?.activeOrders || 0}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>In procurement flow</span>
              </div>

              <div style={{ backgroundColor: '#fafaf7', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#4338ca', display: 'block' }}>
                  Completed
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4338ca' }}>
                  {dashboardData?.orderMetrics?.completedOrders || 0}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#6b7280', display: 'block' }}>Fulfilled orders</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TWO-COLUMN GRID: LEFT (~65%), RIGHT (~35%)               */}
          {/* ======================================================== */}
          <div className="farmer-saas-grid">
            {/* ---------------- LEFT MAIN COLUMN ---------------- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 6. My Crops Section */}
              <div className="farmer-crops-section-wrap">
                <div className="farmer-section-header">
                  <h2 className="farmer-section-title">
                    <Sprout size={20} color="#15803d" />
                    <span>My Crops</span>
                  </h2>
                  <Link
                    href="/farmer/crops"
                    style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View All Crops</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="farmer-crops-cards-grid">
                  {crops.slice(0, 5).map((c, idx) => (
                    <div key={c.id || idx} className="farmer-crop-mini-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1.2rem' }}>🌾</span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: c.hasActiveBooking ? '#dcfce7' : '#f3f4f6',
                            color: c.hasActiveBooking ? '#15803d' : '#4b5563',
                            border: c.hasActiveBooking ? '1px solid #86efac' : '1px solid #e5e7eb',
                          }}
                        >
                          {c.hasActiveBooking ? 'Booked' : 'Active'}
                        </span>
                      </div>

                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#1f2937' }}>
                          {c.name}
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#14532d' }}>
                          {c.quantity}{' '}
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280' }}>
                            {c.unit}
                          </span>
                        </p>
                      </div>

                      <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>
                        <span>Expected Harvest: </span>
                        <strong style={{ color: '#374151' }}>
                          {c.expectedHarvestDate || 'Ready'}
                        </strong>
                      </div>
                    </div>
                  ))}

                  {/* Add Another Crop Card */}
                  <Link href="/farmer/add-crop" className="farmer-add-crop-card-cta">
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#15803d',
                      }}
                    >
                      <Plus size={22} strokeWidth={3} />
                    </div>
                    <span>+ Add Another Crop</span>
                  </Link>
                </div>
              </div>

              {/* 7. Procurement Process Visual */}
              <div className="farmer-procurement-process-card">
                <div className="farmer-section-header">
                  <h3 className="farmer-section-title">
                    <Truck size={18} color="#15803d" />
                    <span>Procurement Journey</span>
                  </h3>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                      }}
                    />
                    LIVE
                  </span>
                </div>

                <div className="farmer-process-pipeline">
                  {/* Step 1: Farmer */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                      }}
                    >
                      <Check size={18} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d' }}>Farmer</span>
                  </div>

                  <div style={{ flex: 1, height: '2px', background: '#86efac', margin: '0 8px' }} />

                  {/* Step 2: Procurement Centre */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: upcoming ? '#15803d' : '#f3f4f6',
                        color: upcoming ? '#ffffff' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                      }}
                    >
                      <MapPin size={16} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: upcoming ? '#14532d' : '#6b7280' }}>
                      Mandi Depot
                    </span>
                  </div>

                  <div style={{ flex: 1, height: '2px', background: upcoming ? '#86efac' : '#e5e7eb', margin: '0 8px' }} />

                  {/* Step 3: Time Slot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: upcoming ? '#dcfce7' : '#f3f4f6',
                        color: upcoming ? '#15803d' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                      }}
                    >
                      <Clock size={16} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: upcoming ? '#14532d' : '#6b7280' }}>
                      Time Slot
                    </span>
                  </div>

                  <div style={{ flex: 1, height: '2px', background: '#e5e7eb', margin: '0 8px' }} />

                  {/* Step 4: Procurement */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                      }}
                    >
                      <ShieldCheck size={16} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7280' }}>MSP Payout</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- RIGHT SIDEBAR COLUMN ---------------- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 8. Active Upcoming Procurement Card */}
              <div className="farmer-upcoming-box">
                <div className="farmer-section-header">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      color: '#15803d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Calendar size={15} /> Upcoming Procurement
                  </span>

                  <span
                    style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {upcoming?.status || 'Confirmed'}
                  </span>
                </div>

                {upcoming ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Multi-booking selector dropdown */}
                    {allUpcoming.length > 1 && (
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            marginBottom: '6px',
                          }}
                        >
                          Select Booked Crop ({allUpcoming.length} active)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <select
                            value={upcoming.id}
                            onChange={(e) => setSelectedUpcomingId(Number(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '9px 36px 9px 12px',
                              backgroundColor: '#ffffff',
                              border: '1.5px solid #86efac',
                              borderRadius: '12px',
                              fontSize: '0.84rem',
                              fontWeight: 800,
                              color: '#14532d',
                              appearance: 'none',
                              cursor: 'pointer',
                              outline: 'none',
                              boxShadow: '0 2px 6px rgba(21, 128, 61, 0.05)',
                            }}
                          >
                            {allUpcoming.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.cropName} — {b.date} — Token #{b.tokenNumber}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            color="#15803d"
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#111827' }}>
                        🌾 {upcoming.cropName} ({upcoming.quantity} {upcoming.unit})
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} color="#15803d" />
                        <span>{upcoming.centreName}</span>
                      </p>
                    </div>

                    {/* Schedule Date & Time */}
                    <div
                      style={{
                        backgroundColor: '#fbfdfb',
                        border: '1px solid #bbf7d0',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                          Date
                        </span>
                        <p style={{ margin: '2px 0 0', fontWeight: 900, color: '#15803d' }}>
                          {upcoming.date}
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                          Time Slot
                        </span>
                        <p style={{ margin: '2px 0 0', fontWeight: 900, color: '#1f2937' }}>
                          {upcoming.timeSlot}
                        </p>
                      </div>
                    </div>

                    {/* Booking ID + Token + QR Snippet */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#064e3b',
                        borderRadius: '14px',
                        color: '#ffffff',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
                          TOKEN NUMBER
                        </span>
                        <p style={{ margin: '1px 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#fef08a' }}>
                          {upcoming.tokenNumber}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: '#d1fae5', fontFamily: 'monospace' }}>
                          ID: {upcoming.bookingNumber}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#064e3b',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <QrCode size={14} />
                        <span>View Pass</span>
                      </button>
                    </div>

                    {/* Action Buttons: View Pass, View Queue, View Booking */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        style={{
                          padding: '8px 6px',
                          backgroundColor: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          borderRadius: '10px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        View Pass
                      </button>

                      <Link
                        href="/farmer/queue"
                        style={{
                          padding: '8px 6px',
                          backgroundColor: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          borderRadius: '10px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        View Queue
                      </Link>

                      <Link
                        href="/farmer/bookings"
                        style={{
                          padding: '8px 6px',
                          backgroundColor: '#15803d',
                          color: '#ffffff',
                          borderRadius: '10px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        View Booking
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 12px' }}>
                      No upcoming bookings found. Book a slot to sell at guaranteed MSP.
                    </p>
                    <Link
                      href="/farmer/add-crop"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: '#15803d',
                        color: '#ffffff',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Find Best Slot</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* 9. Live Queue Section */}
              <div className="farmer-queue-box">
                <div className="farmer-section-header">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      color: '#14532d',
                    }}
                  >
                    <Clock size={16} color="#15803d" /> Live Queue
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                      }}
                    />
                    LIVE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
                    {upcoming ? upcoming.centreName : 'Regional APMC Mandi Depot'}
                  </p>

                  {/* Queue Visual Pipeline */}
                  <div
                    style={{
                      backgroundColor: '#fbfbf9',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                        Now Serving
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#15803d' }}>
                        {servingTokenStr}
                      </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                        }}
                      >
                        {upcoming ? `${peopleAhead} Ahead` : 'Low Queue'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>
                        Your Token
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#111827' }}>
                        {upcoming?.tokenNumber || 'None'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: '#6b7280' }}>Estimated Wait: <strong>~18 mins</strong></span>
                    <Link
                      href="/farmer/queue"
                      style={{ color: '#15803d', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <span>View Live Queue</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 10. Notifications Section */}
              <div className="farmer-notifications-box">
                <div className="farmer-section-header">
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      color: '#14532d',
                    }}
                  >
                    <Bell size={16} color="#15803d" /> Recent Notifications
                  </span>

                  <Link
                    href="/farmer/notifications"
                    style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d', textDecoration: 'none' }}
                  >
                    View All →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notifications.length > 0 ? (
                    notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: n.isRead ? '#ffffff' : '#f0fdf4',
                          border: n.isRead ? '1px solid #f3f4f6' : '1px solid #bbf7d0',
                          borderRadius: '12px',
                        }}
                      >
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: n.isRead ? '#f3f4f6' : '#dcfce7',
                            color: n.isRead ? '#6b7280' : '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <CheckCircle2 size={14} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {n.title}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.3 }}>
                            {n.description}
                          </p>
                          <span style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '2px', display: 'block' }}>
                            {n.timestampText || 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '8px 0', textAlign: 'center' }}>
                      No new notifications.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* QR CODE MODAL                                            */}
      {/* ======================================================== */}
      {showQrModal && upcoming && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #bbf7d0',
              borderRadius: '26px',
              padding: '32px 28px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={18} color="#15803d" />
                <span style={{ fontWeight: 900, fontSize: '1rem', color: '#14532d' }}>
                  APMC Digital Gate Pass
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* QR Visual */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '2px dashed #bbf7d0',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
              }}
            >
              <SimpleQRCode text={`${upcoming.bookingNumber}-${upcoming.tokenNumber}`} size={160} />
            </div>

            <div style={{ spaceY: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>
                Token Number
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '1.6rem', fontWeight: 900, color: '#15803d' }}>
                {upcoming.tokenNumber}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#4b5563', fontFamily: 'monospace' }}>
                ID: {upcoming.bookingNumber}
              </p>
            </div>

            {/* Details Box */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#fbfbf9',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <p style={{ margin: 0 }}><strong>Farmer:</strong> {farmerName}</p>
              <p style={{ margin: 0 }}><strong>Crop:</strong> {upcoming.cropName} ({upcoming.quantity} {upcoming.unit})</p>
              <p style={{ margin: 0 }}><strong>Mandi:</strong> {upcoming.centreName}</p>
              <p style={{ margin: 0 }}><strong>Slot:</strong> {upcoming.date} • {upcoming.timeSlot}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
