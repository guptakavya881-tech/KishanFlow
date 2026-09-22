'use client';

import React from 'react';
import Link from 'next/link';
import PaymentStatusBadge from './PaymentStatusBadge';
import { Sprout, ExternalLink, ShieldCheck, Truck, ArrowUpRight } from 'lucide-react';

export default function PaymentCard({ payment }) {
  if (!payment) return null;

  const isPaid = payment.status === 'PAID';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e5e7eb',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Top Header: Crop Name & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: isPaid ? '#f0fdf4' : '#fef3c7',
                color: isPaid ? '#15803d' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`,
                fontSize: '1.2rem',
              }}
            >
              🌾
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {payment.cropName}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                Order: <strong style={{ color: '#0f172a' }}>{payment.orderNumber}</strong>
              </span>
            </div>
          </div>

          <PaymentStatusBadge status={payment.status} />
        </div>

        {/* Amount Box */}
        <div
          style={{
            backgroundColor: '#fafaf7',
            border: '1px solid #f3f4f6',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', display: 'block' }}>
              Amount Paid
            </span>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
              ₹{Number(payment.amount).toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', display: 'block' }}>
              Lot Quantity
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
              {payment.quantity} {payment.unit || 'kg'}
            </span>
          </div>
        </div>

        {/* Payment Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            fontSize: '0.78rem',
            color: '#475569',
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
              Payment ID
            </span>
            <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
              {payment.paymentNumber || `KF-PAY-${payment.id}`}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
              Transaction ID
            </span>
            <span style={{ fontWeight: 700, color: payment.transactionId ? '#0f172a' : '#94a3b8', fontFamily: 'monospace' }}>
              {payment.transactionId || 'Awaiting gateway ref'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
              Payment Date
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {payment.date || new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {payment.farmerName && (
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
                Farmer Beneficiary
              </span>
              <span style={{ fontWeight: 800, color: '#15803d' }}>
                {payment.farmerName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} style={{ color: '#15803d' }} />
          <span>{payment.paymentMethod || 'Mandi Escrow / Direct DBT'}</span>
        </span>

        {payment.orderNumber && (
          <Link
            href={`/buyer/track-orders?orderId=${encodeURIComponent(payment.orderNumber)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#15803d',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '5px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            <Truck size={13} />
            <span>Track Order</span>
          </Link>
        )}
      </div>
    </div>
  );
}
