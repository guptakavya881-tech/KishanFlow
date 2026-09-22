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
  Bell,
  LogOut,
  HelpCircle,
  Sparkles,
  Menu,
  X,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Loader2,
  RefreshCw,
  Package,
  User,
  ShieldCheck,
  Building2,
  CalendarCheck,
  XCircle,
  FileText,
  AlertCircle,
  CreditCard,
  IndianRupee,
} from 'lucide-react';

export default function FarmerOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    newRequests: 0,
    confirmedOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Modal States
  const [orderToConfirm, setOrderToConfirm] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [confirmAgreedRate, setConfirmAgreedRate] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Set Payment Modal States
  const [orderToSetPayment, setOrderToSetPayment] = useState(null);
  const [setPaymentQty, setSetPaymentQty] = useState('');
  const [setPaymentRate, setSetPaymentRate] = useState('');
  const [setPaymentNotes, setSetPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [setPaymentError, setSetPaymentError] = useState('');

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'farmer')) {
      router.push('/farmer/login');
    }
  }, [user, authLoading, router]);

  // Outside click listener for profile dropdown
  useEffect(() => {
    const handleOutside = () => setProfileDropdownOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Fetch real orders data from backend
  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.append('status', filterStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/farmer/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data.orders || []);
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
      }

      // Fetch unread notifications count
      const notifRes = await fetch('/api/farmer/notifications');
      const notifData = await notifRes.json();
      if (notifData.success) {
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching farmer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'farmer') {
      fetchOrdersData();
    }
  }, [user, filterStatus]);

  // Search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrdersData();
  };

  // Farmer confirms order action (Requirement 7)
  const handleConfirmOrder = async () => {
    if (!orderToConfirm || confirming) return;
    setConfirming(true);
    setConfirmError('');

    try {
      const res = await fetch(`/api/farmer/orders/${orderToConfirm.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreedPrice: confirmAgreedRate ? Number(confirmAgreedRate) : undefined,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        // Update local order status immediately
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderToConfirm.id ? data.data : ord))
        );
        // Refresh metrics
        setMetrics((prev) => ({
          ...prev,
          newRequests: Math.max(0, prev.newRequests - 1),
          confirmedOrders: prev.confirmedOrders + 1,
        }));

        setToastMessage(`Order ${orderToConfirm.orderNumber} confirmed successfully!`);
        setTimeout(() => setToastMessage(''), 4000);
        setOrderToConfirm(null);
      } else {
        setConfirmError(data.error || 'Failed to confirm order.');
      }
    } catch (err) {
      console.error('Error confirming order:', err);
      setConfirmError('Network error while confirming order.');
    } finally {
      setConfirming(false);
    }
  };

  // Farmer sets payment details for confirmed order
  const handleSavePayment = async (e) => {
    if (e) e.preventDefault();
    if (!orderToSetPayment || paymentSubmitting) return;

    try {
      setPaymentSubmitting(true);
      setSetPaymentError('');

      const qty = Number(setPaymentQty);
      const rate = Number(setPaymentRate);

      if (isNaN(qty) || qty <= 0) {
        setSetPaymentError('Please enter a valid final quantity greater than 0.');
        return;
      }
      if (isNaN(rate) || rate <= 0) {
        setSetPaymentError('Please enter a valid price per unit greater than 0.');
        return;
      }

      const res = await fetch(`/api/farmer/orders/${orderToSetPayment.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalQuantity: qty,
          pricePerUnit: rate,
          totalAmount: Math.round(qty * rate * 100) / 100,
          notes: setPaymentNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.order) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderToSetPayment.id ? data.data.order : ord))
        );
        const amt = Number(data.data.order.totalAmount).toLocaleString('en-IN');
        setToastMessage(`Payment of ₹${amt} set for order ${orderToSetPayment.orderNumber}. Ready for buyer payment.`);
        setTimeout(() => setToastMessage(''), 5000);
        setOrderToSetPayment(null);
      } else {
        setSetPaymentError(data.error || 'Failed to save payment details.');
      }
    } catch (err) {
      console.error('Error setting payment:', err);
      setSetPaymentError('Network error while saving payment details.');
    } finally {
      setPaymentSubmitting(false);
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

          {/* Navigation Links - Orders is ACTIVE */}
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
              <Link href="/farmer/orders" className="farmer-saas-nav-item active" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Package size={18} />
                  <span>Orders</span>
                </div>
                {metrics.newRequests > 0 && (
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
                    {metrics.newRequests}
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
            <span>Help & Support</span>
          </Link>
          <button
            type="button"
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
      {/* 2. MAIN AREA                                             */}
      {/* ======================================================== */}
      <div className="farmer-saas-main-area">
        {/* Top Header */}
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
              Order Requests
            </span>
          </div>

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
                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Farmer</span>
              </div>
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 3. PAGE CONTENT                                          */}
        {/* ======================================================== */}
        <main className="farmer-saas-content">
          {/* Toast Message */}
          {toastMessage && (
            <div
              style={{
                backgroundColor: '#dcfce7',
                border: '1.5px solid #86efac',
                borderRadius: '16px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#14532d',
                fontWeight: 700,
                fontSize: '0.9rem',
                marginBottom: '20px',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <CheckCircle2 size={20} color="#15803d" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Tab Switcher: Buyer Orders vs Supplier Orders */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#ffffff',
                backgroundColor: '#15803d',
                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)',
              }}
            >
              Crop Purchase Orders (from Buyers)
            </div>
            <Link
              href="/farmer/supplier-orders"
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#64748b',
                textDecoration: 'none',
                backgroundColor: '#f1f5f9',
                transition: 'all 0.15s ease',
              }}
            >
              My Supplier Orders (Farm Inputs)
            </Link>
          </div>

          {/* Page Title & Subtitle */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
              Buyer Order Requests
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0, fontWeight: 500 }}>
              Review, accept, and manage real procurement requests placed by verified buyers for your registered crops.
            </p>
          </div>

          {/* 4 Summary Cards (Requirement 13) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1.5px solid #e5e7eb', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#d97706' }}>
                  New Requests
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                {metrics.newRequests}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>Awaiting your confirmation</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1.5px solid #e5e7eb', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d' }}>
                  Confirmed Orders
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                {metrics.confirmedOrders}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>Ready for procurement scheduling</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1.5px solid #e5e7eb', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#2563eb' }}>
                  Active Orders
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                {metrics.activeOrders}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>In procurement lifecycle</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', border: '1.5px solid #e5e7eb', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#4338ca' }}>
                  Completed
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                {metrics.completedOrders}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>Procured & fulfilled</span>
            </div>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e5e7eb',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID (e.g. KF-ORD-...), crop name, or buyer name..."
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  fontSize: '0.86rem',
                  outline: 'none',
                  backgroundColor: '#fafaf7',
                  color: '#1f2937',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '11px 22px',
                  borderRadius: '12px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Search
              </button>
            </form>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { label: 'All Orders', value: 'All' },
                { label: 'New Requests', value: 'requested' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
              ].map((tab) => {
                const isActive = filterStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilterStatus(tab.value)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isActive ? '1.5px solid #15803d' : '1.5px solid #e5e7eb',
                      backgroundColor: isActive ? '#dcfce7' : '#ffffff',
                      color: isActive ? '#14532d' : '#6b7280',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 4. ORDERS GRID / EMPTY STATE                             */}
          {/* ======================================================== */}
          {loading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#6b7280' }}>
              <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>Loading order requests...</p>
            </div>
          ) : orders.length === 0 ? (
            // Authentic Empty State (Requirement 23)
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '24px',
                padding: '60px 24px',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '20px auto',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <Package size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                {filterStatus === 'confirmed'
                  ? 'No confirmed orders available for payment setup.'
                  : 'No new order requests'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: '0 0 22px', lineHeight: 1.5 }}>
                {filterStatus === 'confirmed'
                  ? 'When you confirm buyer order requests, you can set the final approved quantity and rate here.'
                  : 'Orders placed for your registered crops will appear here. When buyers discover your crop lots and request procurement, you can review and confirm them here.'}
              </p>
              <Link
                href="/farmer/crops"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '12px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textDecoration: 'none',
                }}
              >
                <Sprout size={16} />
                <span>View My Registered Crops</span>
              </Link>
            </div>
          ) : (
            // Orders Grid conforming to Requirement 6
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {orders.map((order) => {
                const normStatus = (order.status || '').toLowerCase();
                const isRequested = normStatus.includes('requested') || normStatus === 'order placed';
                const isConfirmed = normStatus === 'confirmed';
                const isProcCompleted = normStatus === 'procurement_completed' || normStatus === 'procurement completed';
                const isCompleted = normStatus === 'completed' || isProcCompleted;
                const isCancelled = normStatus === 'cancelled';

                const badgeClass = isRequested
                  ? 'status-requested'
                  : isConfirmed
                  ? 'status-confirmed'
                  : isCompleted
                  ? 'status-completed'
                  : isCancelled
                  ? 'status-cancelled'
                  : 'status-active';

                const displayStatus = isRequested
                  ? 'Order Requested'
                  : isConfirmed
                  ? 'Confirmed'
                  : isProcCompleted
                  ? 'Procurement Completed'
                  : isCompleted
                  ? 'Completed'
                  : order.status;

                return (
                  <div key={order.id} className="farmer-order-card">
                    <div>
                      {/* Top Bar: Crop Name & Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '12px',
                              backgroundColor: isRequested ? '#fef3c7' : '#f0fdf4',
                              color: isRequested ? '#b45309' : '#15803d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `1px solid ${isRequested ? '#fde68a' : '#bbf7d0'}`,
                              flexShrink: 0,
                            }}
                          >
                            <Sprout size={22} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                              {order.cropName}
                            </h3>
                            <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>
                              {order.orderNumber}
                            </span>
                          </div>
                        </div>

                        <span className={`farmer-order-badge ${badgeClass}`}>
                          {isRequested ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                          <span>{displayStatus}</span>
                        </span>
                      </div>

                      {/* Requested Quantity Metric */}
                      <div className="farmer-order-metric-strip">
                        <div>
                          <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                            Requested Quantity
                          </span>
                          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803d' }}>
                            {order.quantity} <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#4b5563' }}>{order.unit || 'kg'}</span>
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                            Buyer
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1f2937' }}>
                            {order.buyerName || 'Registered Buyer'}
                          </span>
                        </div>
                      </div>

                      {/* Info Rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#4b5563', margin: '14px 0 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#d97706" />
                          <span>
                            <strong>Requested On:</strong>{' '}
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={14} color="#15803d" />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <strong>Procurement Centre:</strong> {order.procurementCentre || 'Designated Mandi'}
                          </span>
                        </div>

                        {/* Payment Status (Requirement: Payment Not Set -> Payment Pending -> Payment Received) */}
                        {(() => {
                          const isPaid = (order.paymentStatus || '').toUpperCase() === 'PAID';
                          const isProcessing = (order.paymentStatus || '').toUpperCase() === 'PROCESSING';
                          const hasPaymentConfigured = typeof order.totalAmount === 'number' && order.totalAmount > 0;

                          let paymentBadgeText = 'Payment Not Set';
                          let paymentBadgeColor = '#64748b';
                          let paymentBadgeBg = '#f1f5f9';
                          let paymentBadgeBorder = '#e2e8f0';

                          if (isPaid) {
                            paymentBadgeText = 'Payment Received';
                            paymentBadgeColor = '#15803d';
                            paymentBadgeBg = '#dcfce7';
                            paymentBadgeBorder = '#86efac';
                          } else if (isProcessing) {
                            paymentBadgeText = 'Payment Processing';
                            paymentBadgeColor = '#2563eb';
                            paymentBadgeBg = '#eff6ff';
                            paymentBadgeBorder = '#bfdbfe';
                          } else if (hasPaymentConfigured || (order.paymentStatus || '').toUpperCase() === 'PENDING') {
                            paymentBadgeText = 'Payment Pending';
                            paymentBadgeColor = '#b45309';
                            paymentBadgeBg = '#fef3c7';
                            paymentBadgeBorder = '#fde68a';
                          }

                          return (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#fafaf7',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #f3f4f6',
                                marginTop: '2px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Payment:</span>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: paymentBadgeColor,
                                    backgroundColor: paymentBadgeBg,
                                    border: `1px solid ${paymentBadgeBorder}`,
                                    padding: '1px 8px',
                                    borderRadius: '9999px',
                                  }}
                                >
                                  {paymentBadgeText}
                                </span>
                              </div>

                              {hasPaymentConfigured && (
                                <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
                                  ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Actions: View Order, Confirm Order, and Set/Edit Payment */}
                    {(() => {
                      const isPaid = (order.paymentStatus || '').toUpperCase() === 'PAID';
                      const hasPaymentConfigured = typeof order.totalAmount === 'number' && order.totalAmount > 0;
                      const canSetPayment = ['confirmed', 'procurement scheduled', 'procurement_scheduled', 'ready for procurement', 'ready_for_procurement', 'procurement completed', 'procurement_completed', 'completed'].includes(normStatus);

                      return (
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(order)}
                            style={{
                              flex: 1,
                              minWidth: '85px',
                              padding: '9px 12px',
                              borderRadius: '10px',
                              backgroundColor: '#f3f4f6',
                              color: '#374151',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            View Order
                          </button>

                          {isRequested && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmError('');
                                setOrderToConfirm(order);
                              }}
                              style={{
                                flex: 1,
                                minWidth: '110px',
                                padding: '9px 12px',
                                borderRadius: '10px',
                                backgroundColor: '#15803d',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Confirm Order</span>
                            </button>
                          )}

                          {canSetPayment && !isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setSetPaymentError('');
                                const defaultQty = order.actualQuantity && order.actualQuantity > 0 ? order.actualQuantity : order.quantity;
                                const defaultRate = order.agreedPrice && order.agreedPrice > 0
                                  ? order.agreedPrice
                                  : (order.totalAmount && order.quantity ? Math.round((order.totalAmount / order.quantity) * 100) / 100 : '');
                                setSetPaymentQty(String(defaultQty || ''));
                                setSetPaymentRate(defaultRate ? String(defaultRate) : '');
                                setSetPaymentNotes('');
                                setOrderToSetPayment(order);
                              }}
                              style={{
                                flex: 1,
                                minWidth: '105px',
                                padding: '9px 12px',
                                borderRadius: '10px',
                                backgroundColor: hasPaymentConfigured ? '#e0f2fe' : '#15803d',
                                color: hasPaymentConfigured ? '#0369a1' : '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                border: hasPaymentConfigured ? '1.5px solid #bae6fd' : 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: hasPaymentConfigured ? 'none' : '0 2px 8px rgba(21, 128, 61, 0.25)',
                              }}
                            >
                              <CreditCard size={14} />
                              <span>{hasPaymentConfigured ? 'Edit Payment' : 'Set Payment'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* 5. CONFIRMATION DIALOG MODAL (Requirement 7)             */}
      {/* ======================================================== */}
      {orderToConfirm && (
        <div className="farmer-confirm-modal-overlay" onClick={() => !confirming && setOrderToConfirm(null)}>
          <div className="farmer-confirm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Confirm this order?
                </h3>
              </div>
              {!confirming && (
                <button
                  type="button"
                  onClick={() => setOrderToConfirm(null)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.5 }}>
                By confirming, you accept the buyer's requested quantity and the order will move to the confirmed stage.
              </p>

              {/* Order summary pill */}
              <div style={{ backgroundColor: '#fafaf7', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e5e7eb', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b7280' }}>Crop:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{orderToConfirm.cropName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b7280' }}>Requested Volume:</span>
                  <span style={{ fontWeight: 900, color: '#15803d' }}>
                    {orderToConfirm.quantity} {orderToConfirm.unit || 'kg'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#6b7280' }}>Buyer:</span>
                  <span style={{ fontWeight: 700, color: '#1f2937' }}>{orderToConfirm.buyerName || 'Verified Buyer'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Order Number:</span>
                  <span style={{ fontWeight: 700, color: '#4b5563' }}>{orderToConfirm.orderNumber}</span>
                </div>
              </div>

              {/* Optional agreed rate entry */}
              {(!orderToConfirm.totalAmount || orderToConfirm.totalAmount === 0) && (
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Agreed Mandi Rate (₹/kg) <span style={{ color: '#64748b', fontWeight: 500 }}>(Optional - sets payable amount)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    placeholder="e.g. 25"
                    value={confirmAgreedRate}
                    onChange={(e) => setConfirmAgreedRate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {confirmAgreedRate && !isNaN(Number(confirmAgreedRate)) && Number(confirmAgreedRate) > 0 && (
                    <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                      Total Payable: ₹{Math.round(orderToConfirm.quantity * Number(confirmAgreedRate)).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              )}

              {confirmError && (
                <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600 }}>
                  {confirmError}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fafaf7', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={confirming}
                onClick={() => setOrderToConfirm(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e5e7eb',
                  color: '#4b5563',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmOrder}
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                }}
              >
                {confirming ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ORDER DETAIL MODAL                                    */}
      {/* ======================================================== */}
      {selectedOrderDetails && (
        <div className="farmer-confirm-modal-overlay" onClick={() => setSelectedOrderDetails(null)}>
          <div className="farmer-confirm-modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d' }}>
                  Procurement Request Details
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  Order {selectedOrderDetails.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Order Status & Volume Strip */}
              <div style={{ backgroundColor: '#fafaf7', padding: '16px', borderRadius: '16px', border: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                    Requested Produce
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d' }}>
                    {selectedOrderDetails.quantity} {selectedOrderDetails.unit || 'kg'}
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1f2937', display: 'block' }}>
                    {selectedOrderDetails.cropName}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                    Status
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'block', marginTop: '4px' }}>
                    {selectedOrderDetails.status === 'ORDER_REQUESTED' ? 'Order Requested' : selectedOrderDetails.status === 'PROCUREMENT_COMPLETED' ? 'Procurement Completed' : selectedOrderDetails.status}
                  </span>
                </div>
              </div>

              {/* Specification table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Buyer Name:</span>
                  <span style={{ fontWeight: 800, color: '#1f2937' }}>{selectedOrderDetails.buyerName || 'Verified Buyer'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Payment Status:</span>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: (selectedOrderDetails.paymentStatus || '').toUpperCase() === 'PAID' ? '#15803d' : '#d97706',
                        backgroundColor: (selectedOrderDetails.paymentStatus || '').toUpperCase() === 'PAID' ? '#dcfce7' : '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        display: 'inline-block',
                      }}
                    >
                      {(selectedOrderDetails.paymentStatus || '').toUpperCase() === 'PAID'
                        ? 'Payment Received'
                        : (selectedOrderDetails.paymentStatus || '').toUpperCase() === 'PROCESSING'
                        ? 'Payment Processing'
                        : 'Payment Pending'}
                    </span>
                    {typeof selectedOrderDetails.totalAmount === 'number' && selectedOrderDetails.totalAmount > 0 && (
                      <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace', marginTop: '2px' }}>
                        ₹{Number(selectedOrderDetails.totalAmount).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280' }}>Procurement Centre:</span>
                  <span style={{ fontWeight: 700, color: '#1f2937' }}>{selectedOrderDetails.procurementCentre || 'Designated Mandi'}</span>
                </div>
                {selectedOrderDetails.centreAddress && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>Centre Address:</span>
                    <span style={{ fontWeight: 600, color: '#4b5563', maxWidth: '60%', textAlign: 'right' }}>
                      {selectedOrderDetails.centreAddress}
                    </span>
                  </div>
                )}
                {selectedOrderDetails.bookingToken && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>Gate Pass Token:</span>
                    <span style={{ fontWeight: 800, color: '#15803d' }}>{selectedOrderDetails.bookingToken}</span>
                  </div>
                )}
                {selectedOrderDetails.deliveryNotes && (
                  <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                      Buyer Delivery Notes
                    </span>
                    <p style={{ margin: 0, fontStyle: 'italic', color: '#1f2937' }}>
                      &quot;{selectedOrderDetails.deliveryNotes}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Status History */}
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
                  Status History
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedOrderDetails.statusHistory || []).map((h, i) => (
                    <div key={i} style={{ backgroundColor: '#fafaf7', padding: '10px 12px', borderRadius: '10px', border: '1px solid #f3f4f6', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a' }}>
                        <span>{h.status}</span>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>
                          {new Date(h.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {h.note && <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#6b7280' }}>{h.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fafaf7', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. SET / EDIT PAYMENT MODAL (Requirement: Farmer Set Payment) */}
      {/* ======================================================== */}
      {orderToSetPayment && (
        <div className="farmer-confirm-modal-overlay" onClick={() => !paymentSubmitting && setOrderToSetPayment(null)}>
          <div className="farmer-confirm-modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                    {typeof orderToSetPayment.totalAmount === 'number' && orderToSetPayment.totalAmount > 0 ? 'Edit Payment Details' : 'Set Payment Details'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    Order: {orderToSetPayment.orderNumber}
                  </span>
                </div>
              </div>
              {!paymentSubmitting && (
                <button
                  type="button"
                  onClick={() => setOrderToSetPayment(null)}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <form onSubmit={handleSavePayment}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Safe Order & Buyer Summary Info */}
                <div style={{ backgroundColor: '#fafaf7', padding: '14px 16px', borderRadius: '14px', border: '1px solid #e5e7eb', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#6b7280' }}>Crop Name:</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{orderToSetPayment.cropName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#6b7280' }}>Ordered Quantity:</span>
                    <span style={{ fontWeight: 800, color: '#1f2937' }}>
                      {orderToSetPayment.quantity} {orderToSetPayment.unit || 'kg'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: orderToSetPayment.buyerLocation ? '6px' : 0 }}>
                    <span style={{ color: '#6b7280' }}>Buyer:</span>
                    <span style={{ fontWeight: 700, color: '#1f2937' }}>{orderToSetPayment.buyerName || 'Verified Buyer'}</span>
                  </div>
                  {orderToSetPayment.buyerLocation && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Buyer Location:</span>
                      <span style={{ fontWeight: 600, color: '#4b5563' }}>{orderToSetPayment.buyerLocation}</span>
                    </div>
                  )}
                </div>

                {/* Final / Approved Quantity */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                    Final / Approved Quantity ({orderToSetPayment.unit || 'kg'}) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder={`e.g. ${orderToSetPayment.quantity}`}
                    value={setPaymentQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || Number(val) >= 0) {
                        setSetPaymentQty(val);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.88rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    {orderToSetPayment.actualQuantity
                      ? 'Pre-filled with actual procured quantity.'
                      : 'Enter actual weighed quantity or keep requested quantity.'}
                  </span>
                </div>

                {/* Price Per Unit */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                    Price Per Unit (₹/{orderToSetPayment.unit || 'kg'}) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="e.g. 28.50"
                    value={setPaymentRate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || Number(val) >= 0) {
                        setSetPaymentRate(val);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.88rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    Agreed APMC mandi rate per unit produce.
                  </span>
                </div>

                {/* Calculated Total Amount Preview */}
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: '#166534', display: 'block' }}>
                      Total Payable Amount
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600 }}>
                      {Number(setPaymentQty) > 0 && Number(setPaymentRate) > 0
                        ? `${setPaymentQty} ${orderToSetPayment.unit || 'kg'} × ₹${setPaymentRate}`
                        : 'Final Quantity × Price Per Unit'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
                      ₹{Number(setPaymentQty) > 0 && Number(setPaymentRate) > 0
                        ? (Math.round(Number(setPaymentQty) * Number(setPaymentRate) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Settlement / Weighing Notes (Optional) */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Notes / Remarks <span style={{ color: '#64748b', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weighbridge slip verified, Grade A quality"
                    value={setPaymentNotes}
                    onChange={(e) => setSetPaymentNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Error display */}
                {setPaymentError && (
                  <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{setPaymentError}</span>
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fafaf7', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={paymentSubmitting}
                  onClick={() => setOrderToSetPayment(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e5e7eb',
                    color: '#4b5563',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: paymentSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={paymentSubmitting || !setPaymentQty || !setPaymentRate || Number(setPaymentQty) <= 0 || Number(setPaymentRate) <= 0}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    backgroundColor: paymentSubmitting || !setPaymentQty || !setPaymentRate || Number(setPaymentQty) <= 0 || Number(setPaymentRate) <= 0 ? '#9ca3af' : '#15803d',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    border: 'none',
                    cursor: paymentSubmitting || !setPaymentQty || !setPaymentRate || Number(setPaymentQty) <= 0 || Number(setPaymentRate) <= 0 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  {paymentSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={14} />
                      <span>Set Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
