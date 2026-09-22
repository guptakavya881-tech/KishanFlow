'use client';

import React from 'react';
import { IndianRupee, CheckCircle2, Clock } from 'lucide-react';

export default function FarmerPaymentSummary({ summary }) {
  const s = summary || {
    totalEarned: 0,
    pendingAmount: 0,
    completedCount: 0,
    pendingCount: 0,
  };

  const cards = [
    {
      id: 'received',
      label: 'Total Received',
      amount: `₹${Number(s.totalEarned || 0).toLocaleString('en-IN')}`,
      desc: s.completedCount > 0 ? `${s.completedCount} DBT procurement payments received` : 'No payments received yet',
      icon: CheckCircle2,
      bg: '#ffffff',
      borderColor: '#bbf7d0',
      iconBg: '#dcfce7',
      iconColor: '#15803d',
      amountColor: '#15803d',
    },
    {
      id: 'pending',
      label: 'Pending Payments',
      amount: `₹${Number(s.pendingAmount || 0).toLocaleString('en-IN')}`,
      desc: s.pendingCount > 0 ? `${s.pendingCount} confirmed orders awaiting buyer payment` : 'No pending payments',
      icon: Clock,
      bg: '#ffffff',
      borderColor: '#fde68a',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      amountColor: '#d97706',
    },
    {
      id: 'completed',
      label: 'Completed Payments',
      amount: String(s.completedCount || 0),
      desc: s.completedCount > 0 ? 'Settled order transactions' : '0 transactions',
      icon: IndianRupee,
      bg: '#ffffff',
      borderColor: '#e2e8f0',
      iconBg: '#f1f5f9',
      iconColor: '#475569',
      amountColor: '#0f172a',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: card.amountColor, lineHeight: 1.1 }}>
                {card.amount}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                {card.desc}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
