'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Clock, AlertCircle, Package } from 'lucide-react';

export default function FarmerPaymentCard({ payment }) {
  if (!payment) return null;

  const isPaid = payment.status === 'PAID' || payment.paymentStatus === 'Payment Received';
  const isProcessing = payment.status === 'PROCESSING';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        padding: '22px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div>
        {/* Top Header: Badge & Status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isPaid ? '#dcfce7' : '#fef3c7',
                color: isPaid ? '#15803d' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                border: `1px solid ${isPaid ? '#86efac' : '#fde68a'}`,
              }}
            >
              🌾
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {payment.cropName}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                Order ID: <strong style={{ color: '#0f172a' }}>{payment.orderNumber}</strong>
              </span>
            </div>
          </div>

          <span
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 800,
              backgroundColor: isPaid ? '#dcfce7' : isProcessing ? '#eff6ff' : '#fef3c7',
              color: isPaid ? '#15803d' : isProcessing ? '#2563eb' : '#b45309',
              border: `1px solid ${isPaid ? '#86efac' : isProcessing ? '#bfdbfe' : '#fde68a'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
            <span>{isPaid ? 'Payment Received' : isProcessing ? 'Payment Processing' : 'Payment Pending'}</span>
          </span>
        </div>

        {/* Amount Box */}
        <div
          style={{
            backgroundColor: '#fafaf7',
            border: '1px solid #f3f4f6',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', display: 'block' }}>
              Amount Received
            </span>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
              ₹{Number(payment.amount || payment.procurementAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', display: 'block' }}>
              Crop Quantity
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>
              {payment.quantity || payment.actualQuantity} {payment.unit || 'kg'}
            </span>
          </div>
        </div>

        {/* Payment Details Metadata */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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
              Paid On
            </span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {payment.completedAt
                ? new Date(payment.completedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : payment.date || 'Processing'}
            </span>
          </div>

          {payment.buyerName && (
            <div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
                Procuring Buyer
              </span>
              <span style={{ fontWeight: 800, color: '#15803d' }}>
                {payment.buyerName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
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
        <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={15} style={{ color: '#15803d' }} />
          <span>{payment.paymentMethod || 'Direct Aadhaar / DBT Mandi Settlement'}</span>
        </span>

        <Link
          href={`/farmer/orders`}
          style={{
            fontSize: '0.78rem',
            color: '#15803d',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Package size={13} />
          <span>View In Orders</span>
        </Link>
      </div>
    </div>
  );
}
