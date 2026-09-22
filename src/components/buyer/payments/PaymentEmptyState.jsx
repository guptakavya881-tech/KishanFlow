'use client';

import React from 'react';
import Link from 'next/link';
import { IndianRupee, Package } from 'lucide-react';

export default function PaymentEmptyState({
  title = 'No payment records yet',
  description = 'When you complete procurement payments for your confirmed farmer orders, receipts and settlement records will appear here.',
  actionHref = '/buyer/orders',
  actionLabel = 'View My Orders',
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px dashed #cbd5e1',
        borderRadius: '24px',
        padding: '50px 24px',
        textAlign: 'center',
        maxWidth: '560px',
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
          margin: '0 auto 16px',
          border: '1px solid #bbf7d0',
        }}
      >
        <IndianRupee size={30} />
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.86rem', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionHref && (
        <Link
          href={actionHref}
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
            boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
          }}
        >
          <Package size={16} />
          <span>{actionLabel}</span>
        </Link>
      )}
    </div>
  );
}
