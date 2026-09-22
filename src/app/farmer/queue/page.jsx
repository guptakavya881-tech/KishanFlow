'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  PartyPopper,
  Users,
  AlertTriangle,
  QrCode,
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

export default function FarmerQueuePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queues, setQueues] = useState([]);
  const [completedQueues, setCompletedQueues] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastSync, setLastSync] = useState('Just now');
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

  // 2. Fetch Real Queue Data from Backend
  const fetchQueueData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setLoadError(false);
    }

    try {
      const [queueRes, notifRes] = await Promise.all([
        fetch('/api/farmer/queue'),
        fetch('/api/farmer/notifications?limit=1').catch(() => null),
      ]);

      const queueJson = await queueRes.json();
      if (queueJson.success) {
        setQueues(queueJson.queues || []);
        setCompletedQueues(queueJson.completedQueues || []);
        setLastSync(queueJson.lastUpdated || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
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
      console.error('Error fetching farmer queue status:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchQueueData(false);
    }
  }, [user, fetchQueueData]);

  // Auto-refresh queue every 25 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchQueueData(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [user, fetchQueueData]);

  // 3. Initiate View Pass Flow
  const handleOpenPass = async (item) => {
    if (!item) return;
    setPassModalOpen(true);
    setLoadingPass(true);
    setPassError('');
    setSelectedPass(null);

    try {
      const targetBookingId = item.bookingId || item.id;
      const res = await fetch(`/api/farmer/bookings/${targetBookingId}`);
      const data = await res.json();

      if (data.success && data.booking) {
        setSelectedPass(data.booking);
      } else {
        setPassError('Unable to load your procurement pass. Please try again.');
      }
    } catch (err) {
      console.error('Error loading procurement pass:', err);
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

          {/* Navigation Links - Queue Status is ACTIVE */}
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
              <Link href="/farmer/queue" className="farmer-saas-nav-item active">
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
              Queue Status
            </span>
          </div>

          {/* Right: Notifications Bell & Farmer Profile Pill */}
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
          <div className="farmer-queue-container">
            {/* Top Heading Area & Live Sync Info */}
            <div className="farmer-queue-header-bar">
              <div className="farmer-queue-title-group">
                <h1>Live Queue Status</h1>
                <p>Track your position and procurement status for your booked crops.</p>
              </div>

              <div className="farmer-queue-sync-wrap">
                <button
                  type="button"
                  onClick={() => fetchQueueData(true)}
                  disabled={refreshing}
                  className="farmer-queue-refresh-btn"
                  title="Refresh Queue"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : 'text-slate-600'} />
                  <span>{refreshing ? 'Refreshing...' : `Updated ${lastSync}`}</span>
                </button>
              </div>
            </div>

            {/* Optional Tab Filter if completed procurements exist */}
            {completedQueues.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: activeTab === 'active' ? '#15803d' : '#e5e7eb',
                    backgroundColor: activeTab === 'active' ? '#15803d' : '#ffffff',
                    color: activeTab === 'active' ? '#ffffff' : '#4b5563',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Active Queues ({queues.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('completed')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: activeTab === 'completed' ? '#15803d' : '#e5e7eb',
                    backgroundColor: activeTab === 'completed' ? '#15803d' : '#ffffff',
                    color: activeTab === 'completed' ? '#ffffff' : '#4b5563',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Completed ({completedQueues.length})
                </button>
              </div>
            )}

            {/* Main Content States */}
            {loading ? (
              /* Loading Skeletons */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[1, 2].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '26px',
                      padding: '28px',
                      border: '2px solid #f3f4f6',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#f3f4f6' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ height: '20px', width: '120px', backgroundColor: '#f3f4f6', borderRadius: '6px' }} />
                          <div style={{ height: '14px', width: '80px', backgroundColor: '#f9fafb', borderRadius: '4px' }} />
                        </div>
                      </div>
                      <div style={{ height: '26px', width: '80px', backgroundColor: '#f3f4f6', borderRadius: '9999px' }} />
                    </div>
                    <div style={{ height: '70px', backgroundColor: '#f9fafb', borderRadius: '18px' }} />
                    <div style={{ height: '90px', backgroundColor: '#f9fafb', borderRadius: '18px' }} />
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
                  Unable to load queue information.
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0 }}>
                  Please check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => fetchQueueData(false)}
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
            ) : activeTab === 'active' && queues.length === 0 ? (
              /* Empty State (Farmer has no active bookings) */
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
                  gap: '18px',
                  maxWidth: '580px',
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
                  <Users size={36} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#14532d', margin: 0 }}>
                    No active queue entry.
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b5563', margin: 0, maxWidth: '440px', lineHeight: 1.55 }}>
                    You don&apos;t have any active procurement queues right now. Book a slot for your ready harvest to get your token and start live queue tracking.
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
                    marginTop: '6px',
                  }}
                >
                  <Sparkles size={18} />
                  <span>Find Best Slot</span>
                </Link>
              </div>
            ) : activeTab === 'active' ? (
              /* Active Queue Cards List - ONE CARD PER BOOKED CROP */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {queues.map((item) => {
                  const isYourTurn = item.isYourTurn;
                  const isLive = item.isLive;

                  return (
                    <div
                      key={item.id}
                      className={`farmer-queue-card ${isYourTurn ? 'your-turn' : isLive ? 'live' : 'upcoming'}`}
                    >
                      {/* Top Row: Crop Name, Quantity, and Status Badge */}
                      <div className="farmer-queue-card-top">
                        <div className="farmer-queue-crop-header">
                          <div className="farmer-queue-crop-avatar">
                            <Sprout size={26} />
                          </div>
                          <div>
                            <h2 className="farmer-queue-crop-title">{item.cropName}</h2>
                            <p className="farmer-queue-crop-meta">
                              {item.quantity} {item.unit} • Booking #{item.bookingNumber}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`farmer-queue-badge ${
                            isYourTurn ? 'your-turn' : isLive ? 'live' : 'upcoming'
                          }`}
                        >
                          ● {item.statusBadge || (isLive ? 'LIVE' : 'UPCOMING')}
                        </span>
                      </div>

                      {/* Centre, Date & Time Slot Details */}
                      <div className="farmer-queue-centre-row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <MapPin size={16} color="#15803d" className="shrink-0" />
                            <strong style={{ color: '#111827', fontSize: '0.92rem' }}>
                              {item.centreName}
                            </strong>
                            {item.centreAddress && (
                              <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                                ({item.centreAddress})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', color: '#4b5563', fontSize: '0.82rem', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Calendar size={14} color="#15803d" />
                              <span>{item.date}</span>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Clock size={14} color="#15803d" />
                              <span>{item.timeSlot}</span>
                            </span>
                          </div>
                        </div>

                        {/* Token Pill */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                            Your Token
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: item.tokenNumber ? '1.25rem' : '0.85rem',
                              fontWeight: 900,
                              color: '#92400e',
                              backgroundColor: '#fef3c7',
                              padding: '2px 10px',
                              borderRadius: '8px',
                              border: '1.5px solid #fde68a',
                              marginTop: '2px',
                              fontFamily: item.tokenNumber ? 'monospace' : 'inherit',
                            }}
                          >
                            {item.tokenNumber ? `#${item.tokenNumber}` : 'Token not assigned yet.'}
                          </span>
                        </div>
                      </div>

                      {/* CASE 1: YOUR TURN CELEBRATION BANNER */}
                      {isYourTurn && (
                        <div className="farmer-queue-your-turn-banner">
                          <PartyPopper size={36} color="#ffffff" className="shrink-0" />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>
                              🎉 It&apos;s Your Turn!
                            </strong>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#dcfce7', fontWeight: 600 }}>
                              Your token <strong>#{item.tokenNumber}</strong> is now being served. Please proceed directly to the procurement counter with your crop.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* CASE 2: ACTIVE LIVE QUEUE TRACKER & METRICS */}
                      {isLive && !isYourTurn && (
                        <>
                          {/* 4-Column Metric Grid */}
                          <div className="farmer-queue-grid-metrics">
                            <div className="farmer-queue-metric-item">
                              <span className="farmer-queue-metric-lbl">
                                <Ticket size={12} color="#b45309" /> Your Token
                              </span>
                              <span className="farmer-queue-metric-val user">
                                #{item.tokenNumber}
                              </span>
                            </div>

                            <div className="farmer-queue-metric-item">
                              <span className="farmer-queue-metric-lbl">
                                <Users size={12} color="#15803d" /> Now Serving
                              </span>
                              <span className="farmer-queue-metric-val serving">
                                {item.currentServingToken || 'Active'}
                              </span>
                            </div>

                            <div className="farmer-queue-metric-item">
                              <span className="farmer-queue-metric-lbl">
                                <Users size={12} color="#6b7280" /> People Ahead
                              </span>
                              <span className="farmer-queue-metric-val">
                                {item.peopleAhead} {item.peopleAhead === 1 ? 'farmer' : 'farmers'}
                              </span>
                            </div>

                            <div className="farmer-queue-metric-item">
                              <span className="farmer-queue-metric-lbl">
                                <Clock size={12} color="#6b7280" /> Est. Wait
                              </span>
                              <span className="farmer-queue-metric-val">
                                {typeof item.estimatedWaitMinutes === 'number' && item.estimatedWaitMinutes !== null
                                  ? (item.estimatedWaitMinutes === 0 ? 'Your Turn' : `~${item.estimatedWaitMinutes} mins`)
                                  : 'Waiting time unavailable'}
                              </span>
                            </div>
                          </div>

                          {/* Visual Queue Timeline Tracker */}
                          <div className="farmer-queue-tracker-box">
                            <div className="farmer-queue-tracker-title">
                              <span>Live Queue Movement</span>
                              <span style={{ color: '#15803d', fontWeight: 900 }}>
                                Queue Position: #{item.queuePosition}
                              </span>
                            </div>

                            <div className="farmer-queue-timeline-track">
                              {item.tokensSequence?.map((step, idx) => (
                                <React.Fragment key={idx}>
                                  <div className="farmer-queue-step-node">
                                    <span
                                      className={`farmer-queue-node-pill ${
                                        step.isServing ? 'serving' : step.isUser ? 'user' : 'intermediate'
                                      }`}
                                    >
                                      {step.token}
                                    </span>
                                    <span className="farmer-queue-node-lbl">
                                      {step.label}
                                    </span>
                                  </div>

                                  {idx < item.tokensSequence.length - 1 && (
                                    <div
                                      style={{
                                        flex: 1,
                                        height: '2px',
                                        backgroundColor: '#cbd5e1',
                                        minWidth: '24px',
                                        margin: '0 4px 18px',
                                      }}
                                    />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* CASE 3: UPCOMING QUEUE (FUTURE DATES) */}
                      {!isLive && (
                        <div className="farmer-queue-upcoming-box">
                          <Clock size={22} color="#b45309" className="shrink-0 mt-0.5" />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '0.98rem', fontWeight: 900, color: '#92400e' }}>
                              Queue Upcoming
                            </strong>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f', lineHeight: 1.45 }}>
                              {item.upcomingNotice || 'Queue information will be available when the procurement centre starts the queue.'}
                            </p>
                            <span style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 700, marginTop: '2px' }}>
                              {item.queueOpensText || `Queue will open on: ${item.date} (${item.timeSlot})`}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons: View Pass and View Booking */}
                      <div className="farmer-queue-actions-row">
                        <Link
                          href="/farmer/bookings"
                          className="farmer-queue-btn-booking"
                        >
                          <span>View Booking</span>
                          <ArrowRight size={14} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleOpenPass(item)}
                          className="farmer-queue-btn-pass"
                        >
                          <Ticket size={16} />
                          <span>View Pass</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Completed Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {completedQueues.map((c) => (
                  <div
                    key={c.id}
                    className="farmer-queue-card"
                    style={{ borderStyle: 'dashed' }}
                  >
                    <div className="farmer-queue-card-top">
                      <div className="farmer-queue-crop-header">
                        <div className="farmer-queue-crop-avatar" style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', color: '#6b7280' }}>
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1f2937' }}>
                            {c.cropName}
                          </h3>
                          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                            {c.quantity} {c.unit} • {c.centreName}
                          </span>
                        </div>
                      </div>

                      <span className="farmer-queue-badge completed">
                        ● COMPLETED
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: '#4b5563', flexWrap: 'wrap', gap: '8px' }}>
                      <span>Date: <strong>{c.date}</strong> ({c.timeSlot})</span>
                      <span>Token: <strong style={{ fontFamily: 'monospace' }}>#{c.tokenNumber}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* 3. PROCUREMENT PASS MODAL (SAME REAL MODAL AS MY CROPS)  */}
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
