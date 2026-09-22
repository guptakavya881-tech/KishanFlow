'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  CheckCheck,
  Package,
  IndianRupee,
  Calendar,
  Truck,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2,
  Filter,
} from 'lucide-react';

export default function BuyerNotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/buyer/notifications?limit=50');
      const data = await res.json();

      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? 0);
        setTotalCount(data.totalCount ?? data.notifications.length);
      } else {
        setError(data.error || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Unable to load notifications. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await fetch('/api/buyer/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);

      const res = await fetch('/api/buyer/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      const data = await res.json();
      if (data.success && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.relatedOrderId) {
      router.push(`/buyer/track-orders?orderId=${notification.relatedOrderId}`);
    }
  };

  const getNotificationIcon = (n) => {
    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();

    if (title.includes('cancel') || title.includes('reject') || title.includes('failed')) {
      return (
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: '#fef2f2',
          border: '1.5px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc2626',
          flexShrink: 0,
        }}>
          <AlertCircle size={20} />
        </div>
      );
    }

    if (type === 'payment' || title.includes('payment') || title.includes('paid')) {
      return (
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb',
          flexShrink: 0,
        }}>
          <IndianRupee size={20} />
        </div>
      );
    }

    if (type === 'procurement' || title.includes('procurement') || title.includes('slot')) {
      return (
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: '#faf5ff',
          border: '1.5px solid #e9d5ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7c3aed',
          flexShrink: 0,
        }}>
          <Truck size={20} />
        </div>
      );
    }

    if (title.includes('confirm') || title.includes('completed')) {
      return (
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          backgroundColor: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#16a34a',
          flexShrink: 0,
        }}>
          <CheckCircle2 size={20} />
        </div>
      );
    }

    return (
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        backgroundColor: '#f0fdf4',
        border: '1.5px solid #bbf7d0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#15803d',
        flexShrink: 0,
      }}>
        <Package size={20} />
      </div>
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') {
      return !n.isRead;
    }
    return true;
  });

  return (
    <BuyerLayout>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Header Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1.5px solid #e5e7eb',
          padding: '24px 28px',
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Bell size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#111827' }}>
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      padding: '2px 9px',
                      borderRadius: '9999px',
                    }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#6b7280' }}>
                  Real-time updates on orders, confirmations, mandi weighment, and payments.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: markingAll ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CheckCheck size={16} style={{ color: '#15803d' }} />
                  <span>Mark all as read</span>
                </button>
              )}

              <button
                type="button"
                onClick={fetchNotifications}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  color: '#4b5563',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                title="Refresh notifications"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Filter Tabs (All / Unread) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderTop: '1px solid #f3f4f6',
            paddingTop: '14px',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: activeTab === 'all' ? '#15803d' : '#f3f4f6',
                color: activeTab === 'all' ? '#ffffff' : '#4b5563',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: activeTab === 'unread' ? '#15803d' : '#f3f4f6',
                color: activeTab === 'unread' ? '#ffffff' : '#4b5563',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: activeTab === 'unread' ? '#ffffff' : '#ef4444',
                  color: activeTab === 'unread' ? '#15803d' : '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications Body */}
        {loading && notifications.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #e5e7eb',
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280', fontWeight: 600 }}>
              Loading real notifications...
            </p>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #fecaca',
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <AlertCircle size={36} style={{ color: '#dc2626' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#991b1b' }}>
              Error Loading Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#6b7280' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchNotifications}
              style={{
                marginTop: '8px',
                padding: '8px 20px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #bbf7d0',
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 4px 20px -4px rgba(21, 128, 61, 0.04)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d',
            }}>
              <Bell size={30} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#14532d' }}>
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet 🌱'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280', maxWidth: '420px', lineHeight: 1.5 }}>
              {activeTab === 'unread'
                ? "You've read all your notifications. Switch to 'All' to review earlier updates."
                : 'Your order, procurement and payment updates will appear here.'}
            </p>
          </div>
        ) : (
          /* Notifications List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredNotifications.map((n) => {
              const isUnread = !n.isRead;
              const hasLink = Boolean(n.actionUrl || n.relatedOrderId);

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    backgroundColor: isUnread ? '#fafffd' : '#ffffff',
                    borderRadius: '18px',
                    border: isUnread ? '1.5px solid #86efac' : '1.5px solid #e5e7eb',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: hasLink || isUnread ? 'pointer' : 'default',
                    boxShadow: isUnread ? '0 4px 12px rgba(21, 128, 61, 0.06)' : 'none',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (hasLink || isUnread) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasLink || isUnread) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = isUnread ? '0 4px 12px rgba(21, 128, 61, 0.06)' : 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    {getNotificationIcon(n)}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.94rem',
                          fontWeight: isUnread ? 900 : 800,
                          color: '#111827',
                          lineHeight: 1.25,
                        }}>
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#15803d',
                          }} />
                        )}
                      </div>

                      <p style={{
                        margin: 0,
                        fontSize: '0.84rem',
                        color: isUnread ? '#374151' : '#6b7280',
                        lineHeight: 1.45,
                        fontWeight: isUnread ? 600 : 500,
                      }}>
                        {n.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', color: '#9ca3af', fontWeight: 600 }}>
                          {n.timestampText || 'Just now'}
                        </span>

                        {hasLink && (
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#15803d',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <span>View details</span>
                            <ArrowRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mark Read Action Button */}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        color: '#15803d',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
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
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
