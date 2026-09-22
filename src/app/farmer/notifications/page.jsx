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
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ArrowRight,
  Loader2,
  RefreshCw,
  CreditCard,
  Users,
  Eye,
  Package,
} from 'lucide-react';

export default function FarmerNotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const LIMIT = 20;

  // 1. Authentication Protection Guard
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'farmer')) {
      router.push('/farmer/login');
    }
  }, [user, authLoading, router]);

  // 2. Fetch Notifications from Real Database API
  const fetchNotifications = async (targetOffset = 0, isAppend = false) => {
    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setLoadError(false);
    }

    try {
      const res = await fetch(`/api/farmer/notifications?limit=${LIMIT}&offset=${targetOffset}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.notifications)) {
        if (isAppend) {
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }
        setUnreadCount(data.unreadCount ?? 0);
        setTotalCount(data.totalCount ?? data.notifications.length);
        setHasMore(data.hasMore ?? false);
        setOffset(targetOffset);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Error fetching farmer notifications:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications(0, false);
    }
  }, [user]);

  // 3. Mark Single Notification as Read
  const handleMarkRead = async (id) => {
    if (!id) return;
    try {
      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await fetch('/api/farmer/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // 4. Mark All Notifications as Read
  const handleMarkAllRead = async () => {
    try {
      // Optimistic UI update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);

      const res = await fetch('/api/farmer/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount ?? 0);
        setToastMessage('All notifications marked as read.');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  // 5. Load More Pagination
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextOffset = offset + LIMIT;
      fetchNotifications(nextOffset, true);
    }
  };

  // 6. Filter Notifications by Type
  const filterList = [
    { label: 'All', key: 'All' },
    { label: 'Bookings', key: 'Bookings' },
    { label: 'Crops', key: 'Crops' },
    { label: 'Tokens', key: 'Tokens' },
    { label: 'Queue', key: 'Queue' },
    { label: 'Payments', key: 'Payments' },
  ];

  const matchesFilter = (n, filterKey) => {
    if (filterKey === 'All') return true;
    const t = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    const desc = (n.description || '').toLowerCase();

    if (filterKey === 'Bookings') {
      return t === 'booking' || t === 'slot' || title.includes('booking') || title.includes('slot');
    }
    if (filterKey === 'Crops') {
      return t === 'crop' || title.includes('crop');
    }
    if (filterKey === 'Tokens') {
      return t === 'token' || title.includes('token') || desc.includes('token') || Boolean(n.relatedToken);
    }
    if (filterKey === 'Queue') {
      return t === 'queue' || title.includes('queue') || title.includes('turn') || desc.includes('ahead');
    }
    if (filterKey === 'Payments') {
      return t === 'payment' || title.includes('payment') || title.includes('₹') || desc.includes('₹');
    }
    return true;
  };

  const filteredNotifications = notifications.filter((n) => matchesFilter(n, activeFilter));

  const getFilterCount = (filterKey) => {
    return notifications.filter((n) => matchesFilter(n, filterKey)).length;
  };

  // 7. Icon Helper by Notification Category
  const getNotificationIcon = (n) => {
    const t = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();

    if (title.includes('cancelled') || title.includes('removed')) {
      return <Trash2 size={20} color="#dc2626" />;
    }
    if (t === 'crop' || title.includes('crop')) {
      return <Sprout size={20} color="#15803d" />;
    }
    if (t === 'token' || title.includes('token')) {
      return <Ticket size={20} color="#d97706" />;
    }
    if (t === 'queue' || title.includes('queue')) {
      return <Users size={20} color="#7c3aed" />;
    }
    if (t === 'payment' || title.includes('payment') || title.includes('₹')) {
      return <CreditCard size={20} color="#0284c7" />;
    }
    if (t === 'booking' || t === 'slot') {
      return <Calendar size={20} color="#15803d" />;
    }
    return <Bell size={20} color="#15803d" />;
  };

  // 8. Action Link Helper
  const getActionLink = (n) => {
    const t = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();

    if (t === 'crop' || title.includes('crop')) {
      return { href: '/farmer/crops', label: 'View Crops' };
    }
    if (t === 'queue' || title.includes('queue')) {
      return { href: '/farmer/queue', label: 'View Queue' };
    }
    if (t === 'booking' || t === 'slot' || t === 'token' || title.includes('booking') || title.includes('token')) {
      return { href: '/farmer/bookings', label: 'View Booking' };
    }
    return null;
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

          {/* Navigation Links - Notifications is ACTIVE */}
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
              <Link href="/farmer/queue" className="farmer-saas-nav-item">
                <Clock size={18} />
                <span>Queue Status</span>
              </Link>
            </li>
            <li>
              <Link href="/farmer/notifications" className="farmer-saas-nav-item active" style={{ justifyContent: 'space-between' }}>
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
              Notifications
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
          <div className="farmer-notif-container">
            {/* Top Heading Area & Mark All as Read */}
            <div className="farmer-notif-header-bar">
              <div className="farmer-notif-title-group">
                <h1>Notifications</h1>
                <p>Stay updated with your crops, bookings, procurement slots and token status.</p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="farmer-notif-mark-all-btn"
                >
                  <CheckCheck size={16} />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="farmer-notif-filters">
              {filterList.map((f) => {
                const count = getFilterCount(f.key);
                const isActive = activeFilter === f.key;

                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveFilter(f.key)}
                    className={`farmer-notif-filter-btn ${isActive ? 'active' : ''}`}
                  >
                    <span>{f.label}</span>
                    <span className="farmer-notif-badge">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* States: Loading, Error, Empty, or Notifications List */}
            {loading && notifications.length === 0 ? (
              /* Loading Skeletons */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '20px',
                      padding: '20px',
                      border: '1.5px solid #f3f4f6',
                      display: 'flex',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        backgroundColor: '#f3f4f6',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ height: '16px', width: '40%', backgroundColor: '#f3f4f6', borderRadius: '4px' }} />
                      <div style={{ height: '14px', width: '70%', backgroundColor: '#f9fafb', borderRadius: '4px' }} />
                      <div style={{ height: '12px', width: '20%', backgroundColor: '#f9fafb', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError && notifications.length === 0 ? (
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
                  Unable to load notifications.
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0 }}>
                  Please check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => fetchNotifications(0, false)}
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
            ) : filteredNotifications.length === 0 ? (
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
                  <Bell size={38} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#14532d', margin: 0 }}>
                    No Notifications Yet
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                    You&apos;re all caught up. Updates about your crops, bookings, procurement slots and token status will appear here.
                  </p>
                </div>
              </div>
            ) : (
              /* Notifications List */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredNotifications.map((n) => {
                  const isUnread = !n.isRead;
                  const action = getActionLink(n);

                  return (
                    <div
                      key={n.id}
                      onClick={() => isUnread && handleMarkRead(n.id)}
                      className={`farmer-notif-card ${isUnread ? 'unread' : ''}`}
                      style={{ cursor: isUnread ? 'pointer' : 'default' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                        {/* Notification Icon Badge */}
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            backgroundColor: isUnread ? '#ffffff' : '#f9fafb',
                            border: isUnread ? '1.5px solid #bbf7d0' : '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: isUnread ? '0 2px 8px rgba(21, 128, 61, 0.08)' : 'none',
                          }}
                        >
                          {getNotificationIcon(n)}
                        </div>

                        {/* Text Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: '0.95rem',
                                fontWeight: isUnread ? 900 : 800,
                                color: '#111827',
                                lineHeight: 1.25,
                              }}
                            >
                              {n.title}
                            </h3>

                            {isUnread && (
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: '#15803d',
                                  flexShrink: 0,
                                }}
                                title="Unread"
                              />
                            )}
                          </div>

                          <p
                            style={{
                              margin: '2px 0 0 0',
                              fontSize: '0.85rem',
                              color: isUnread ? '#1f2937' : '#4b5563',
                              lineHeight: 1.45,
                              fontWeight: isUnread ? 600 : 500,
                            }}
                          >
                            {n.description}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.74rem', color: '#9ca3af', fontWeight: 600 }}>
                              {n.timestampText || 'Just now'}
                            </span>

                            {/* Contextual Action Link */}
                            {action && (
                              <Link
                                href={action.href}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isUnread) handleMarkRead(n.id);
                                }}
                                className="farmer-notif-action-link"
                              >
                                <span>{action.label}</span>
                                <ArrowRight size={13} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Mark Read Button */}
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#15803d',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            flexShrink: 0,
                          }}
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Load More Pagination */}
                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #d1d5db',
                        color: '#374151',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        cursor: loadingMore ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-emerald-600" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Notifications</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Success Toast Feedback */}
      {toastMessage && (
        <div className="farmer-crop-toast">
          <CheckCircle2 size={20} color="#86efac" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
