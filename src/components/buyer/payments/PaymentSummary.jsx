'use client';

import React from 'react';
import { IndianRupee, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function PaymentSummary({ summary }) {
  const s = summary || {
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalPaid: 0,
    pendingAmount: 0,
  };

  const cards = [
    {
      id: 'total',
      label: 'Total Payments',
      count: s.totalPayments || 0,
      subtext: s.totalPaid > 0 ? `₹${Number(s.totalPaid).toLocaleString('en-IN')} disbursed` : 'Lifetime settlements',
      icon: IndianRupee,
      bg: '#f8fafc',
      borderColor: '#e2e8f0',
      iconBg: '#f1f5f9',
      iconColor: '#475569',
      valueColor: '#0f172a',
    },
    {
      id: 'successful',
      label: 'Successful Payments',
      count: s.successfulPayments || 0,
      subtext: s.successfulPayments > 0 ? `${s.successfulPayments} paid to farmers` : 'None completed yet',
      icon: CheckCircle2,
      bg: '#ffffff',
      borderColor: '#bbf7d0',
      iconBg: '#dcfce7',
      iconColor: '#15803d',
      valueColor: '#15803d',
    },
    {
      id: 'pending',
      label: 'Pending Payments',
      count: s.pendingPayments || 0,
      subtext: s.pendingAmount > 0 ? `₹${Number(s.pendingAmount).toLocaleString('en-IN')} awaiting pay` : 'No pending orders',
      icon: Clock,
      bg: '#ffffff',
      borderColor: '#fde68a',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      valueColor: '#d97706',
    },
    {
      id: 'failed',
      label: 'Failed Payments',
      count: s.failedPayments || 0,
      subtext: s.failedPayments > 0 ? 'Action required' : 'Zero payment issues',
      icon: XCircle,
      bg: '#ffffff',
      borderColor: '#fecaca',
      iconBg: '#fee2e2',
      iconColor: '#b91c1c',
      valueColor: '#b91c1c',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            style={{
              backgroundColor: card.bg,
              borderRadius: '18px',
              border: `1.5px solid ${card.borderColor}`,
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>
                {card.label}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: card.iconBg,
                  color: card.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: card.valueColor, lineHeight: 1.1 }}>
                {card.count}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
