'use client';

import React, { useState, useEffect } from 'react';
import SupplierLayout from '@/components/supplier/SupplierLayout';
import {
  Bell,
  Package,
  Loader2,
} from 'lucide-react';

export default function SupplierNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifs() {
      try {
        setLoading(true);
        const res = await fetch('/api/supplier/orders?limit=10');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const notifs = json.data.map((o) => ({
            id: `notif-${o.id}`,
            title: `Order #${o.orderNumber}: ${o.status}`,
            description: `Farmer ${o.farmerName || 'Partner'} ordered ${o.quantity} units of ${o.productName} (₹${o.totalAmount}).`,
            date: o.createdAt,
            icon: Package,
            status: o.status,
          }));
          setNotifications(notifs);
        }
      } catch (err) {
        console.error('Error loading supplier notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifs();
  }, []);

  return (
    <SupplierLayout
      title="Notifications"
      subtitle="Live order events, dispatch milestones, and inventory advisories."
    >
      <div className="supplier-saas-content" style={{ maxWidth: '900px' }}>
        <div className="supplier-card">
          <div className="supplier-card-header">
            <div>
              <h2 className="supplier-card-title">Supplier Notifications</h2>
              <p className="supplier-card-subtitle">
                Real-time alerts for incoming farmer procurement requests and delivery status changes.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px', color: '#15803d' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Loading alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1',
              }}
            >
              <Bell size={38} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>
                No notifications at this time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                          {n.title}
                        </p>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                          {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                        {n.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SupplierLayout>
  );
}
