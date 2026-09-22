'use client';

import React from 'react';
import { Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrderSummaryCards({ metrics }) {
  const cards = [
    {
      id: 'total',
      label: 'Total Orders',
      value: metrics?.totalOrders ?? 0,
      icon: Package,
      bgColor: '#f0fdf4',
      textColor: '#15803d',
      borderColor: '#bbf7d0',
      description: 'All-time procurement requests',
    },
    {
      id: 'active',
      label: 'Active Orders',
      value: metrics?.activeOrders ?? 0,
      icon: Clock,
      bgColor: '#eff6ff',
      textColor: '#1d4ed8',
      borderColor: '#bfdbfe',
      description: 'In procurement or delivery pipeline',
    },
    {
      id: 'completed',
      label: 'Completed Orders',
      value: metrics?.completedOrders ?? 0,
      icon: CheckCircle2,
      bgColor: '#ecfdf5',
      textColor: '#047857',
      borderColor: '#a7f3d0',
      description: 'Successfully received & verified',
    },
    {
      id: 'pending',
      label: 'Pending Requests',
      value: metrics?.pendingRequests ?? 0,
      icon: AlertCircle,
      bgColor: '#fffbeb',
      textColor: '#b45309',
      borderColor: '#fde68a',
      description: 'Awaiting mandi allocation',
    },
  ];

  return (
    <div className="buyer-orders-summary-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className="buyer-order-summary-card">
            <div
              className="buyer-order-summary-icon"
              style={{
                backgroundColor: card.bgColor,
                color: card.textColor,
                border: `1px solid ${card.borderColor}`,
              }}
            >
              <Icon size={22} className="stroke-[2.2]" />
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280', letterSpacing: '0.04em', display: 'block' }}>
                {card.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '2px 0' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                  {card.value}
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#9ca3af' }}>
                  {card.value === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 500, display: 'block' }}>
                {card.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
