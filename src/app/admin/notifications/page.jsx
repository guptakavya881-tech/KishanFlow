'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Bell,
  Search,
  CheckCircle2,
  Package,
  IndianRupee,
  Calendar,
  Sprout,
  Users,
  RefreshCw,
  X,
  Clock,
  Layers,
  CheckCheck,
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.set('type', selectedType);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
        setTotalCount(json.data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [selectedType, search]);

  const markAsRead = async (id) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return <Package size={18} className="text-blue-600" />;
      case 'payment':
        return <IndianRupee size={18} className="text-emerald-600" />;
      case 'booking':
        return <Calendar size={18} className="text-amber-600" />;
      case 'crop':
        return <Sprout size={18} className="text-green-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const filterTabs = [
    { label: 'All Events', value: 'ALL' },
    { label: 'Orders', value: 'order' },
    { label: 'Payments', value: 'payment' },
    { label: 'Bookings', value: 'booking' },
    { label: 'Crops', value: 'crop' },
  ];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="admin-page-title">System Notifications</h1>
              {unreadCount > 0 ? (
                <span className="admin-count-pill amber">{unreadCount} Unread</span>
              ) : (
                <span className="admin-count-pill">{totalCount} Logged</span>
              )}
            </div>
            <p className="admin-page-subtitle">
              Live chronological activity, transaction alerts, and mandi operation milestones
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={actionLoading}
                className="admin-refresh-btn"
                style={{ backgroundColor: '#ffffff', color: '#15803d', borderColor: '#bbf7d0' }}
              >
                <CheckCheck size={16} />
                <span>Mark All as Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadNotifications}
              className="admin-refresh-btn"
              title="Refresh notifications"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="admin-filter-bar">
          <div className="admin-tabs-row">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSelectedType(tab.value)}
                className={`admin-filter-pill ${selectedType === tab.value ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-search-wrapper" style={{ maxWidth: '320px' }}>
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="admin-search-clear-btn"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="admin-loading-box">
            <RefreshCw size={22} className="animate-spin" />
            <span>Retrieving system notification logs...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Bell size={24} />
            </div>
            <p className="admin-empty-title">
              {search ? 'No matching notifications found.' : 'No notifications yet.'}
            </p>
            <p className="admin-empty-text">
              {search
                ? `No system events matched "${search}".`
                : 'Real platform events like order creation, bookings, and payments will show up here.'}
            </p>
          </div>
        ) : (
          <div className="admin-notification-list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`admin-notification-card ${notif.isRead === 0 ? 'unread' : ''}`}
                onClick={() => notif.isRead === 0 && markAsRead(notif.id)}
              >
                <div className="admin-notif-left">
                  <div className="admin-notif-icon-wrap">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 className="admin-notif-title">{notif.title}</h4>
                      {notif.isRead === 0 && <span className="admin-unread-dot" />}
                    </div>

                    <p className="admin-notif-desc">{notif.description}</p>

                    <div className="admin-notif-meta-row">
                      <span className="admin-notif-type-tag">
                        {notif.type?.toUpperCase()}
                      </span>
                      {notif.userName && (
                        <span style={{ color: '#4b5563', fontWeight: 600 }}>
                          User: {notif.userName} ({notif.userRole})
                        </span>
                      )}
                      <span>•</span>
                      <span>{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {notif.isRead === 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notif.id);
                    }}
                    className="admin-mark-read-btn"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={16} />
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
