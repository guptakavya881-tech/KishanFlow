'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Building2, Calendar, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function PayableOrderCard({ order, onPayNow }) {
  if (!order) return null;

  const hasAmount = typeof order.totalAmount === 'number' && order.totalAmount > 0;
  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid';
  const isProcessing = order.paymentStatus === 'PROCESSING' || order.paymentStatus === 'Processing';

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1.5px solid #e2e8f0',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div>
        {/* Top Header: Crop & Order Number */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bbf7d0',
                fontSize: '1.2rem',
              }}
            >
              🌾
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {order.cropName}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                Order: <strong style={{ color: '#0f172a' }}>{order.orderNumber}</strong>
              </span>
            </div>
          </div>

          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: isPaid ? '#dcfce7' : isProcessing ? '#eff6ff' : '#fef3c7',
              color: isPaid ? '#15803d' : isProcessing ? '#2563eb' : '#b45309',
              border: `1px solid ${isPaid ? '#86efac' : isProcessing ? '#bfdbfe' : '#fde68a'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isPaid ? <CheckCircle2 size={12} /> : isProcessing ? <Clock size={12} /> : <AlertCircle size={12} />}
            <span>{isPaid ? 'Payment Completed' : isProcessing ? 'Payment Processing' : 'Payment Pending'}</span>
          </span>
        </div>

        {/* Quantity & Amount Box */}
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
              Order Quantity
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b' }}>
              {order.quantity} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{order.unit || 'kg'}</span>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#94a3b8', display: 'block' }}>
              Payable Amount
            </span>
            {hasAmount ? (
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
                ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            ) : (
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#94a3b8', fontStyle: 'italic' }}>
                Payment amount not available
              </span>
            )}
          </div>
        </div>

        {/* Mandi Centre & Farmer Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} style={{ color: '#15803d', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong>Mandi:</strong> {order.procurementCentre || 'Designated APMC Centre'}
            </span>
          </div>

          {order.farmerName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>Farmer:</span>
              <strong style={{ color: '#1e293b' }}>{order.farmerName}</strong>
              {order.farmerLocation && <span style={{ color: '#64748b' }}>({order.farmerLocation})</span>}
            </div>
          )}

          {hasAmount ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7', fontSize: '0.76rem', marginTop: '2px' }}>
              <span style={{ color: '#166534', fontWeight: 700 }}>Price per unit:</span>
              <strong style={{ color: '#15803d', fontFamily: 'monospace' }}>
                ₹{order.agreedPrice ? Number(order.agreedPrice) : (Number(order.totalAmount) / Number(order.quantity)).toFixed(2)} / {order.unit || 'kg'}
              </strong>
            </div>
          ) : (
            <div style={{ marginTop: '4px', backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.76rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, color: '#d97706' }} />
              <span>You can pay when farmer will set the payment.</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <Link
          href={`/buyer/orders`}
          style={{
            fontSize: '0.78rem',
            color: '#64748b',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          View Order Details
        </Link>

        {isPaid ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 800,
            }}
          >
            <CheckCircle2 size={14} color="#15803d" />
            <span>Payment Completed</span>
          </span>
        ) : isProcessing ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              fontSize: '0.82rem',
              fontWeight: 800,
            }}
          >
            <Clock size={14} />
            <span>Payment Processing</span>
          </span>
        ) : hasAmount ? (
          <button
            type="button"
            onClick={() => onPayNow && onPayNow(order)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '10px',
              backgroundColor: '#15803d',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <CreditCard size={15} />
            <span>Pay Now</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              color: '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'not-allowed',
            }}
          >
            <span>Amount Not Set</span>
          </button>
        )}
      </div>
    </div>
  );
}
