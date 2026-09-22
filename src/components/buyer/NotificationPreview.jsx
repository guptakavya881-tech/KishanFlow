'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  Package,
  Truck,
  IndianRupee,
  Clock,
  ArrowRight,
  CheckCircle2,
  Inbox,
} from 'lucide-react';

const NOTIF_ICONS = {
  produce: Bell,
  order: Package,
  dispatch: Truck,
  payment: IndianRupee,
  booking: CheckCircle2,
  queue: Clock,
};

export default function NotificationPreview({ notifications = [], unreadCount = 0 }) {
  const hasItems = notifications && notifications.length > 0;

  return (
    <div className="buyer-widget-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bell size={16} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            Recent Notifications
          </h3>
        </div>

        {unreadCount > 0 ? (
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#15803d',
            backgroundColor: '#dcfce7',
            padding: '2px 8px',
            borderRadius: '9999px',
          }}>
            {unreadCount} New
          </span>
        ) : (
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 8px',
            borderRadius: '9999px',
          }}>
            0 New
          </span>
        )}
      </div>

      {/* Notifications List or Truthful Empty State */}
      <div>
        {hasItems ? (
          notifications.map((item) => {
            const Icon = NOTIF_ICONS[item.type] || Bell;
            const isUnread = !item.isRead;

            return (
              <div
                key={item.id}
                className={`buyer-notif-item ${isUnread ? 'unread' : ''}`}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isUnread ? '#15803d' : '#e5e7eb',
                    color: isUnread ? '#ffffff' : '#4b5563',
                    marginTop: '2px',
                  }}
                >
                  <Icon size={14} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: isUnread ? '#0f172a' : '#374151',
                      lineHeight: 1.2,
                    }}>
                      {item.title}
                    </p>
                    {isUnread && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803d', flexShrink: 0 }} />
                    )}
                  </div>

                  <p style={{
                    margin: '3px 0 0',
                    fontSize: '0.72rem',
                    color: '#6b7280',
                    lineHeight: 1.3,
                  }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.66rem', color: '#9ca3af' }}>
                    <Clock size={11} />
                    <span>{item.timestampText || 'Just now'}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            backgroundColor: '#fafaf7',
            borderRadius: '14px',
            border: '1px dashed #e5e7eb',
          }}>
            <Inbox size={26} style={{ color: '#9ca3af', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151', margin: '0 0 2px' }}>
              No new notifications
            </p>
            <p style={{ fontSize: '0.74rem', color: '#6b7280', margin: 0 }}>
              You are all caught up with your procurement alerts.
            </p>
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
        <Link
          href="/buyer/notifications"
          style={{
            fontSize: '0.76rem',
            fontWeight: 800,
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
          }}
        >
          <span>View All Notifications</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
