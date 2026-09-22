'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import { GenericCropIcon } from '@/components/farmer/FarmIllustrations';
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
  Plus,
  Sparkles,
  Menu,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Loader2,
  RefreshCw,
  QrCode,
  Package,
} from 'lucide-react';

// Reusable SVG QR Code Generator Component matching KishanFlow design
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

export default function MyCropsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simple delete modal state
  const [cropToDelete, setCropToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Procurement Pass modal state
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

  // 2. Fetch ONLY crops that have an active/upcoming/confirmed booking
  const fetchCropsData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [cropsRes, dashRes] = await Promise.all([
        fetch('/api/farmer/crops'),
        fetch('/api/farmer/dashboard').catch(() => null),
      ]);

      const cropsJson = await cropsRes.json();
      if (cropsJson.success) {
        setCrops(cropsJson.crops || []);
      } else {
        setLoadError(true);
      }

      if (dashRes) {
        const dashJson = await dashRes.json();
        if (dashJson.success && dashJson.data) {
          setUnreadCount(dashJson.data.unreadNotificationCount || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching booked farmer crops:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCropsData();
    }
  }, [user]);

  // 3. Initiate View Pass Flow
  const handleOpenPass = async (crop) => {
    if (!crop) return;
    setPassModalOpen(true);
    setLoadingPass(true);
    setPassError('');
    setSelectedPass(null);

    try {
      const targetBookingId = crop.bookingId || crop.id;
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
    setLoadingPass(false);
    setPassError('');
    setSelectedPass(null);
  };

  // 4. Initiate Remove Crop Flow (Show simple confirmation modal)
  const handleInitiateDelete = (crop) => {
    setDeleteError('');
    setCropToDelete(crop);
  };

  // 5. Cancel Remove
  const handleCancelDelete = () => {
    setCropToDelete(null);
    setDeleteError('');
  };

  // 6. Confirm and Execute Delete via Backend API
  const handleConfirmDelete = async () => {
    if (!cropToDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');

    const bookingId = cropToDelete.bookingId;
    const cropId = cropToDelete.cropId || cropToDelete.id;
    const targetId = bookingId || cropId;

    try {
      const res = await fetch(`/api/farmer/crops/${targetId}?bookingId=${bookingId || ''}&cropId=${cropId || ''}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        // Remove crop from My Crops immediately
        setCrops((prev) =>
          prev.filter((c) => {
            if (bookingId && c.bookingId) return c.bookingId !== bookingId;
            if (cropId && c.cropId) return c.cropId !== cropId;
            return (c.cropId || c.bookingId || c.id) !== targetId;
          })
        );
        setCropToDelete(null);
        setToastMessage('Crop removed successfully.');
        setTimeout(() => setToastMessage(''), 4000);
        // Re-fetch current data from backend to ensure complete persistence & state sync
        fetchCropsData();
      } else {
        setDeleteError(data.error || 'Unable to remove this crop. Please try again.');
      }
    } catch (err) {
      console.error('Error removing crop:', err);
      setDeleteError('Unable to remove this crop. Please try again.');
    } finally {
      setDeleting(false);
    }
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

          {/* Navigation Links - My Crops is ACTIVE */}
          <ul className="farmer-saas-nav-list">
            <li>
              <Link href="/farmer/dashboard" className="farmer-saas-nav-item">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/crops" className="farmer-saas-nav-item active">
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
              My Crops
            </span>
          </div>

          {/* Right: Notifications & Farmer Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
          {/* Top Heading Area with + ADD CROP Button */}
          <div className="farmer-crops-header-bar">
            <div className="farmer-crops-title-group">
              <h1>MY CROPS</h1>
              <p>Manage all your registered crops in one place.</p>
            </div>

            <Link href="/farmer/add-crop" className="farmer-add-crop-main-btn">
              <Plus size={18} strokeWidth={2.5} />
              <span>+ ADD CROP</span>
            </Link>
          </div>

          {/* ======================================================== */}
          {/* STATES: LOADING, ERROR, EMPTY, OR CROPS GRID            */}
          {/* ======================================================== */}
          {loading ? (
            /* Loading Skeleton */
            <div className="farmer-crops-full-grid">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="farmer-crop-skeleton-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#e5e7eb' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ height: '18px', width: '50%', backgroundColor: '#e5e7eb', borderRadius: '6px' }} />
                      <div style={{ height: '12px', width: '30%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '14px', width: '70%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                    <div style={{ height: '14px', width: '80%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                  </div>
                  <div style={{ height: '36px', backgroundColor: '#f3f4f6', borderRadius: '12px' }} />
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
                maxWidth: '560px',
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
                Unable to load your crops.
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0 }}>
                Please check your network connection and try again.
              </p>
              <button
                type="button"
                onClick={fetchCropsData}
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
          ) : crops.length === 0 ? (
            /* Empty State: ONLY for when farmer has no active bookings */
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
                margin: '20px auto',
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
                <Sprout size={40} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#14532d', margin: 0 }}>
                  No Active Crops
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#4b5563', margin: 0, maxWidth: '400px' }}>
                  You currently don&apos;t have any crops with an active procurement booking.
                </p>
              </div>
              <Link
                href="/farmer/add-crop"
                className="farmer-add-crop-main-btn"
                style={{ marginTop: '8px' }}
              >
                <Sparkles size={18} />
                <span>Find Best Slot</span>
              </Link>
            </div>
          ) : (
            /* Real Booked Crops Grid */
            <div className="farmer-crops-full-grid">
              {crops.map((crop) => {
                const formattedHarvestDate = crop.expectedHarvestDate || 'Flexible';
                const formattedBookingDate = crop.bookingDate || 'Scheduled';
                const timeSlot = crop.bookingTimeSlot || '11:30 AM – 12:00 PM';
                const centreName = crop.procurementCentre || 'Mandi Procurement Centre';
                const bookingNum = crop.bookingNumber || `KF-${crop.bookingId}`;
                const tokenNum = crop.tokenNumber ? `#${crop.tokenNumber}` : '#KF-591';

                return (
                  <div key={crop.bookingId || crop.id} className="farmer-crop-detail-card">
                    {/* Top Identity & Status */}
                    <div>
                      <div className="farmer-crop-card-top">
                        <div className="farmer-crop-card-identity">
                          <div className="farmer-crop-icon-badge">
                            <GenericCropIcon name={crop.name} className="w-9 h-9" />
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: '1.25rem',
                                fontWeight: 900,
                                color: '#111827',
                                margin: 0,
                                lineHeight: 1.2,
                              }}
                            >
                              {crop.name}
                            </h3>
                            <div
                              style={{
                                fontSize: '1.15rem',
                                fontWeight: 900,
                                color: '#15803d',
                                marginTop: '4px',
                              }}
                            >
                              {Number(crop.quantity).toLocaleString()}{' '}
                              <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 700 }}>
                                {crop.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Booking Status Badge */}
                        <span className="farmer-crop-status-pill booked">
                          <CheckCircle2 size={12} />
                          <span>{crop.status || 'Confirmed'}</span>
                        </span>
                      </div>

                      {/* Real Booking & Crop Details */}
                      <div
                        style={{
                          marginTop: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '9px',
                          backgroundColor: '#f9fafb',
                          padding: '14px 16px',
                          borderRadius: '16px',
                          border: '1.5px solid #f3f4f6',
                        }}
                      >
                        {/* Procurement Centre */}
                        <div className="farmer-crop-meta-row" style={{ alignItems: 'flex-start' }}>
                          <MapPin size={15} color="#15803d" style={{ marginTop: '2px', shrink: 0 }} />
                          <div>
                            <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Procurement Centre
                            </span>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1f2937' }}>
                              {centreName}
                            </span>
                          </div>
                        </div>

                        {/* Booking Date & Time Slot */}
                        <div className="farmer-crop-meta-row" style={{ alignItems: 'flex-start' }}>
                          <Calendar size={15} color="#15803d" style={{ marginTop: '2px', shrink: 0 }} />
                          <div>
                            <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Booking Date &amp; Time
                            </span>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1f2937' }}>
                              {formattedBookingDate} • {timeSlot}
                            </span>
                          </div>
                        </div>

                        {/* Expected Harvest Date */}
                        <div className="farmer-crop-meta-row">
                          <Clock size={15} color="#6b7280" />
                          <span style={{ fontSize: '0.82rem', color: '#4b5563' }}>
                            Expected Harvest: <strong>{formattedHarvestDate}</strong>
                          </span>
                        </div>

                        {/* Booking ID & Token Badges */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '4px',
                            paddingTop: '8px',
                            borderTop: '1px dashed #e5e7eb',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700 }}>
                              Booking ID
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151' }}>
                              {bookingNum}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '8px',
                              border: '1px solid #fde68a',
                              fontSize: '0.82rem',
                              fontWeight: 900,
                            }}
                          >
                            <Ticket size={13} />
                            <span>{tokenNum}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="farmer-crop-card-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenPass(crop)}
                        className="farmer-crop-book-cta"
                        title={`View Pass for ${crop.name}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        <QrCode size={15} />
                        <span>View Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInitiateDelete(crop)}
                        className="farmer-crop-remove-btn"
                        title={`Remove ${crop.name}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                        <span>Remove Crop</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* 2.5. VIEW PROCUREMENT PASS MODAL                         */}
      {/* ======================================================== */}
      {passModalOpen && (
        <div className="farmer-crop-modal-backdrop" onClick={handleClosePass}>
          <div
            className="farmer-crop-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              backgroundColor: '#fbf9f4',
              border: '2px solid #bbf7d0',
              padding: '24px 24px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(21, 128, 61, 0.22)',
            }}
          >
            {/* Modal Top Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1.5px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WheatLogo size={30} showText={false} href={null} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem', fontWeight: 900 }}>
                    <span style={{ color: '#15803d' }}>KISHAN</span>
                    <span style={{ color: '#d97706', marginLeft: '4px' }}>FLOW</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 800, letterSpacing: '0.04em' }}>
                    Procurement Pass
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePass}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  color: '#6b7280',
                  borderRadius: '8px',
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Loading State */}
            {loadingPass ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 16px',
                  gap: '14px',
                  textAlign: 'center',
                }}
              >
                <Loader2 size={36} className="animate-spin" color="#15803d" />
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#15803d', margin: 0 }}>
                  Loading your procurement pass...
                </p>
              </div>
            ) : passError ? (
              /* Error State - No Fake QR */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '28px 16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#991b1b', margin: '0 0 6px 0' }}>
                    Unable to load your procurement pass.
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                    Please try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClosePass}
                  style={{
                    marginTop: '8px',
                    padding: '10px 26px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            ) : selectedPass ? (
              /* Pass Body with Real Booking & QR Data */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                {/* Official Pass Card Container */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #d1fae5',
                    borderRadius: '18px',
                    padding: '18px',
                    boxShadow: '0 4px 14px rgba(21, 128, 61, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Grid of Verified Booking Details */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '12px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Crop
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: '#111827' }}>
                        {selectedPass.cropName}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Quantity
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: '#15803d' }}>
                        {selectedPass.quantity} {selectedPass.unit}
                      </strong>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Procurement Centre
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: '#1f2937' }}>
                        {selectedPass.centreName}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Date
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: '#1f2937' }}>
                        {selectedPass.date}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Time
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: '#1f2937' }}>
                        {selectedPass.timeSlot}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Booking ID
                      </span>
                      <strong style={{ fontSize: '0.84rem', color: '#374151', fontFamily: 'monospace' }}>
                        {selectedPass.bookingNumber}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
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
                      marginTop: '2px',
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

      {/* ======================================================== */}
      {/* 3. REMOVE CROP SIMPLE CONFIRMATION MODAL                 */}
      {/* ======================================================== */}
      {cropToDelete && (
        <div className="farmer-crop-modal-backdrop">
          <div className="farmer-crop-modal-dialog">
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1.5px solid #f3f4f6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', margin: 0 }}>
                  Remove Crop?
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCancelDelete}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  color: '#9ca3af',
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '6px' }}>
              <p style={{ fontSize: '1rem', color: '#374151', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                Are you sure you want to remove this crop?
              </p>

              <div
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                    {cropToDelete.name}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                    {cropToDelete.quantity} {cropToDelete.unit} • Token #{cropToDelete.tokenNumber || 'KF-591'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                  }}
                >
                  {cropToDelete.status || 'Confirmed'}
                </span>
              </div>

              {deleteError && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#b91c1c',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                  }}
                >
                  {deleteError}
                </div>
              )}

              {/* Action Buttons: Cancel and Yes, Remove */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  style={{
                    padding: '11px 22px',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    borderRadius: '12px',
                    border: '1.5px solid #d1d5db',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 24px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.75 : 1,
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Yes, Remove</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUCCESS TOAST FEEDBACK                                */}
      {/* ======================================================== */}
      {toastMessage && (
        <div className="farmer-crop-toast">
          <CheckCircle2 size={20} color="#86efac" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
