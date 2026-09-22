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
  Ticket,
  Bell,
  LogOut,
  HelpCircle,
  Sparkles,
  Menu,
  X,
  RefreshCw,
  Loader2,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  QrCode,
  AlertTriangle,
  CalendarCheck,
  ShieldCheck,
  Package,
} from 'lucide-react';

// Reusable SVG QR Code Component matching KishanFlow design
function SimpleQRCode({ text, size = 170 }) {
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const grid = 15;
  const hash = hashString(text || 'KF-247');
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
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ borderRadius: '12px', backgroundColor: '#ffffff', padding: '6px', border: '1px solid #e5e7eb' }}
    >
      <rect width={size} height={size} fill="#ffffff" />
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#15803d"
        />
      ))}
    </svg>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Upcoming', 'In Queue', 'Completed', 'Cancelled'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // View Pass Modal State
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [selectedPass, setSelectedPass] = useState(null);

  // 1. Authentication Protection Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'farmer')) {
      router.push('/farmer/login');
    }
  }, [user, authLoading, router]);

  // 2. Fetch All Bookings for Authenticated Farmer
  const refreshBookings = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [bookingsRes, notifRes] = await Promise.all([
        fetch('/api/farmer/bookings'),
        fetch('/api/farmer/notifications?limit=1').catch(() => null),
      ]);

      const json = await bookingsRes.json();
      if (json.success && Array.isArray(json.bookings)) {
        setBookings(json.bookings);
      } else {
        setLoadError(true);
      }

      if (notifRes) {
        const notifJson = await notifRes.json();
        if (notifJson.success) {
          setUnreadCount(notifJson.unreadCount ?? 0);
        }
      }
    } catch (err) {
      console.error('Error fetching farmer bookings:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshBookings();
    }
  }, [user]);

  // 3. Tab Filter List
  const tabsList = ['All', 'Upcoming', 'In Queue', 'Completed', 'Cancelled'];

  const matchesTab = (b, tab) => {
    if (tab === 'All') return true;
    if (tab === 'Upcoming') {
      return b.status === 'Confirmed' || b.status === 'Upcoming';
    }
    if (tab === 'In Queue') {
      return b.status === 'In Queue' || b.status === 'Waiting' || b.status === 'Your Turn';
    }
    if (tab === 'Completed') {
      return b.status === 'Completed';
    }
    if (tab === 'Cancelled') {
      return b.status === 'Cancelled';
    }
    return true;
  };

  const filteredBookings = bookings.filter((b) => matchesTab(b, activeTab));

  const getTabCount = (tab) => {
    return bookings.filter((b) => matchesTab(b, tab)).length;
  };

  // 4. Cancel Booking Action
  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this procurement booking?')) return;

    try {
      const res = await fetch(`/api/farmer/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg('Booking cancelled successfully.');
        await refreshBookings();
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to cancel booking.');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Network error while cancelling booking.');
    }
  };

  // 5. Open Verified Pass Modal
  const handleOpenPass = async (booking) => {
    if (!booking) return;
    setPassModalOpen(true);
    setLoadingPass(true);
    setPassError('');
    setSelectedPass(null);

    try {
      const res = await fetch(`/api/farmer/bookings/${booking.id}`);
      const data = await res.json();
      if (data.success && data.booking) {
        setSelectedPass(data.booking);
      } else {
        setPassError('Unable to load your procurement pass. Please try again.');
      }
    } catch (err) {
      console.error('Error loading pass:', err);
      setPassError('Unable to load your procurement pass. Please try again.');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleClosePass = () => {
    setPassModalOpen(false);
    setSelectedPass(null);
    setPassError('');
  };

  const farmerName = user?.fullName || 'Farmer';
  const farmerInitial = farmerName.charAt(0).toUpperCase();

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

          {/* Navigation Links - My Bookings is ACTIVE */}
          <ul className="farmer-saas-nav-list">
            <li>
              <Link href="/farmer/dashboard" className="farmer-saas-nav-item">
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
              <Link href="/farmer/orders" className="farmer-saas-nav-item">
                <Package size={18} />
                <span>Orders</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/bookings" className="farmer-saas-nav-item active">
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
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <div className="farmer-saas-main-area">
        {/* Top Header Bar */}
        <header className="farmer-saas-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              My Bookings
            </span>
          </div>

          {/* Right: Notification Bell & Farmer Profile Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/farmer/notifications"
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px 12px 5px 6px',
                borderRadius: '9999px',
                backgroundColor: '#f9fafb',
                border: '1.5px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
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
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1f2937' }}>
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

        {/* Content Body */}
        <main className="farmer-saas-content">
          <div className="farmer-bookings-container">
            {/* Top Heading Area & Book New Slot Button */}
            <div className="farmer-bookings-header-bar">
              <div className="farmer-bookings-title-group">
                <h1>My Bookings</h1>
                <p>Track upcoming scheduled slots, past procurements, and digital tokens.</p>
              </div>

              <Link
                href="/farmer/add-crop"
                className="farmer-bookings-btn-new"
              >
                <Sparkles size={16} />
                <span>Book New Slot</span>
              </Link>
            </div>

            {/* Feedback Alert */}
            {actionMsg && (
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} />
                <span>{actionMsg}</span>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="farmer-bookings-filter-tabs">
              {tabsList.map((tab) => {
                const count = getTabCount(tab);
                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`farmer-bookings-filter-btn ${isActive ? 'active' : ''}`}
                  >
                    <span>{tab}</span>
                    <span className="farmer-bookings-badge">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Bookings List States */}
            {loading ? (
              /* Loading Skeletons */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      padding: '24px',
                      border: '2px solid #f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#f3f4f6' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ height: '18px', width: '130px', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                          <div style={{ height: '12px', width: '90px', backgroundColor: '#f9fafb', borderRadius: '4px' }} />
                        </div>
                      </div>
                      <div style={{ height: '26px', width: '75px', backgroundColor: '#f3f4f6', borderRadius: '9999px' }} />
                    </div>
                    <div style={{ height: '60px', backgroundColor: '#f9fafb', borderRadius: '14px' }} />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              /* Error State */
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #fed7aa',
                  borderRadius: '24px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  maxWidth: '540px',
                  margin: '30px auto',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#fff7ed',
                    color: '#ea580c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={28} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#9a3412', margin: 0 }}>
                  Unable to load your bookings.
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0 }}>
                  Please check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={refreshBookings}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    marginTop: '6px',
                  }}
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>
              </div>
            ) : filteredBookings.length > 0 ? (
              /* Cards List: RENDER ALL BOOKINGS */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredBookings.map((b) => {
                  const isUpcomingOrActive =
                    b.status === 'Confirmed' ||
                    b.status === 'Upcoming' ||
                    b.status === 'In Queue' ||
                    b.status === 'Waiting' ||
                    b.status === 'Your Turn';

                  return (
                    <div key={b.id} className="farmer-booking-card">
                      {/* Card Top: Crop info and Status + Token */}
                      <div className="farmer-booking-card-top">
                        <div className="farmer-booking-crop-header">
                          <div className="farmer-booking-crop-avatar">
                            <Sprout size={24} />
                          </div>
                          <div>
                            <h3 className="farmer-booking-crop-title">
                              {b.cropName} • {Number(b.quantity).toLocaleString()} {b.unit}
                            </h3>
                            <p className="farmer-booking-crop-meta">
                              Booking ID: <strong style={{ fontFamily: 'monospace' }}>{b.bookingNumber}</strong>
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.84rem',
                              fontWeight: 900,
                              color: '#92400e',
                              backgroundColor: '#fef3c7',
                              padding: '3px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #fde68a',
                              fontFamily: 'monospace',
                            }}
                          >
                            Token: #{b.tokenNumber}
                          </span>

                          <span
                            className={`farmer-booking-badge ${
                              b.status === 'Confirmed' || b.status === 'Upcoming'
                                ? 'confirmed'
                                : b.status === 'In Queue' || b.status === 'Waiting' || b.status === 'Your Turn'
                                ? 'in-queue'
                                : b.status === 'Completed'
                                ? 'completed'
                                : 'cancelled'
                            }`}
                          >
                            ● {b.status}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="farmer-booking-details-grid">
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                            Procurement Centre
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                            <MapPin size={14} color="#15803d" className="shrink-0" />
                            <span>{b.centreName}</span>
                          </strong>
                          {b.centreAddress && (
                            <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                              {b.centreAddress}
                            </span>
                          )}
                        </div>

                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                            Date &amp; Time
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                            <Calendar size={14} color="#15803d" className="shrink-0" />
                            <span>{b.date}</span>
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={13} color="#15803d" className="shrink-0" />
                            <span>{b.timeSlot}</span>
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                            Payment / Estimated MSP
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              color: b.paymentStatus ? '#15803d' : '#6b7280',
                              backgroundColor: b.paymentStatus ? '#f0fdf4' : '#f9fafb',
                              border: b.paymentStatus ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              marginTop: '2px',
                            }}
                          >
                            {b.paymentStatus || 'Guaranteed MSP on arrival'}
                            {b.procurementAmount ? ` (₹${Number(b.procurementAmount).toLocaleString()})` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="farmer-booking-actions-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenPass(b)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 18px',
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              border: '1.5px solid #bbf7d0',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Ticket size={15} />
                            <span>View Pass</span>
                          </button>

                          {isUpcomingOrActive && (
                            <Link
                              href="/farmer/queue"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 18px',
                                backgroundColor: '#15803d',
                                color: '#ffffff',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Users size={14} />
                              <span>Queue Status</span>
                            </Link>
                          )}
                        </div>

                        {/* Cancel Action if booking is active */}
                        {isUpcomingOrActive && (
                          <button
                            type="button"
                            onClick={() => handleCancel(b.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#dc2626',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                            }}
                          >
                            <XCircle size={15} />
                            <span>Cancel Booking</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '28px',
                  padding: '60px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  maxWidth: '560px',
                  margin: '30px auto',
                  boxShadow: '0 6px 24px rgba(21, 128, 61, 0.05)',
                }}
              >
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '24px',
                    backgroundColor: '#f0fdf4',
                    border: '2px solid #bbf7d0',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(21, 128, 61, 0.08)',
                  }}
                >
                  <CalendarCheck size={36} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#14532d', margin: 0 }}>
                    No Bookings Yet
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                    {activeTab === 'All'
                      ? 'Your confirmed procurement bookings will appear here. Book a slot for your ready harvest to get guaranteed MSP.'
                      : `You currently don't have any bookings under the "${activeTab}" filter.`}
                  </p>
                </div>
                <Link
                  href="/farmer/add-crop"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
                    marginTop: '4px',
                  }}
                >
                  <Sparkles size={18} />
                  <span>Find Best Slot</span>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* 3. PROCUREMENT PASS MODAL (SAME REAL PASS AS MY CROPS)   */}
      {/* ======================================================== */}
      {passModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={handleClosePass}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '28px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              border: '2px solid #bbf7d0',
              position: 'relative',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close icon */}
            <button
              type="button"
              onClick={handleClosePass}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#4b5563',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {loadingPass ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin text-emerald-600" />
                <span style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: 700 }}>
                  Loading procurement pass...
                </span>
              </div>
            ) : passError ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <AlertTriangle size={36} color="#dc2626" />
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#991b1b', fontWeight: 700 }}>
                  {passError}
                </p>
                <button
                  type="button"
                  onClick={handleClosePass}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            ) : selectedPass ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Modal Title & Brand Header */}
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.74rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <ShieldCheck size={14} /> Official Mandi Pass
                  </div>
                  <h3 style={{ margin: '6px 0 0', fontSize: '1.35rem', fontWeight: 900, color: '#14532d' }}>
                    Procurement Entry Pass
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Present this verified pass at the centre gate.
                  </span>
                </div>

                {/* Details Breakdown */}
                <div
                  style={{
                    backgroundColor: '#fbfbf9',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '20px',
                    padding: '16px 18px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Crop Name
                    </span>
                    <strong style={{ fontSize: '0.98rem', color: '#111827' }}>
                      {selectedPass.cropName}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Quantity
                    </span>
                    <strong style={{ fontSize: '0.98rem', color: '#15803d' }}>
                      {selectedPass.quantity} {selectedPass.unit}
                    </strong>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Procurement Centre
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>
                      {selectedPass.centreName}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Date
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: '#1f2937' }}>
                      {selectedPass.date}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Time
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: '#1f2937' }}>
                      {selectedPass.timeSlot}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Booking ID
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: '#374151', fontFamily: 'monospace' }}>
                      {selectedPass.bookingNumber}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      Token
                    </span>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.92rem',
                        fontWeight: 900,
                        color: '#92400e',
                        backgroundColor: '#fef3c7',
                        padding: '1px 8px',
                        borderRadius: '6px',
                        border: '1px solid #fde68a',
                      }}
                    >
                      #{selectedPass.tokenNumber}
                    </span>
                  </div>

                  <div
                    style={{
                      gridColumn: 'span 2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px dashed #e5e7eb',
                      paddingTop: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>
                      Status
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        padding: '3px 12px',
                        borderRadius: '9999px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      {selectedPass.status || 'Confirmed'}
                    </span>
                  </div>
                </div>

                {/* Real QR Code Display */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '16px',
                    border: '1.5px dashed #86efac',
                  }}
                >
                  <SimpleQRCode
                    text={`${selectedPass.bookingNumber}-${selectedPass.tokenNumber}`}
                    size={180}
                  />
                  <p
                    style={{
                      margin: '12px 0 0',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#4b5563',
                      textAlign: 'center',
                    }}
                  >
                    Scan this QR code at the procurement centre.
                  </p>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClosePass}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
