'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Building2, Calendar, Clock, Truck, ArrowRight, XCircle } from 'lucide-react';

export default function BuyerOrderCard({ order, onViewDetails }) {
  const norm = (order.status || '').toLowerCase().trim();
  const isCancelled = norm === 'cancelled';
  const isProcurementCompleted = norm === 'procurement_completed' || norm === 'procurement completed';
  const isCompleted = norm === 'completed' || isProcurementCompleted;
  const isRequested = norm === 'order_requested' || norm === 'order placed' || norm === 'order requested';
  const isConfirmed = norm === 'confirmed';

  const badgeClass =
    isCancelled ? 'status-cancelled' :
    isCompleted ? 'status-completed' :
    isRequested ? 'status-pending' :
    'status-confirmed';

  const badgeLabel =
    isRequested ? 'Order Request Sent' :
    isConfirmed ? 'Confirmed' :
    isProcurementCompleted ? 'Procurement Completed' :
    order.status;

  return (
    <div className="buyer-order-item-card">
      <div>
        {/* Top Header: Crop Name, Order ID & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: isCancelled ? '#fee2e2' : '#f0fdf4',
              color: isCancelled ? '#991b1b' : '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `1px solid ${isCancelled ? '#fecaca' : '#bbf7d0'}`,
            }}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                {order.cropName}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>
                {order.orderNumber}
              </span>
            </div>
          </div>

          <span className={`buyer-order-badge ${badgeClass}`}>
            {isCancelled ? <XCircle size={12} /> : <Clock size={12} />}
            <span>{badgeLabel}</span>
          </span>
        </div>

        {/* Quantity & Procurement Metric Box */}
        <div className="buyer-metric-box">
          <div>
            <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
              Order Quantity
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803d' }}>
              {order.quantity} <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4b5563' }}>{order.unit || 'kg'}</span>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
              Ordered On
            </span>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1f2937' }}>
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Location & Procurement Centre Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
            <Building2 size={14} style={{ color: '#15803d', flexShrink: 0 }} />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.procurementCentre || 'Designated Mandi Samiti'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '0.76rem' }}>
            <Calendar size={13} style={{ color: '#d97706', flexShrink: 0 }} />
            <span>Target Date: {order.expectedDate || 'Immediate'}</span>
          </div>

          {/* Payment Status & Amount Strip (Requirement 18) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fafaf7',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #f3f4f6',
              marginTop: '2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Payment:</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: (order.paymentStatus || '').toUpperCase() === 'PAID' ? '#15803d' : '#d97706',
                  backgroundColor: (order.paymentStatus || '').toUpperCase() === 'PAID' ? '#dcfce7' : '#fef3c7',
                  padding: '1px 8px',
                  borderRadius: '9999px',
                }}
              >
                {(order.paymentStatus || '').toUpperCase() === 'PAID'
                  ? 'Paid'
                  : (order.paymentStatus || '').toUpperCase() === 'PROCESSING'
                  ? 'Processing'
                  : 'Pending'}
              </span>
            </div>

            {typeof order.totalAmount === 'number' && order.totalAmount > 0 && (
              <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
                ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isCancelled && (
            <Link
              href={`/buyer/track-orders?orderId=${encodeURIComponent(order.orderNumber)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#15803d',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '6px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Truck size={13} />
              <span>Track Order</span>
            </Link>
          )}

          {isConfirmed && (order.paymentStatus || '').toUpperCase() !== 'PAID' && typeof order.totalAmount === 'number' && order.totalAmount > 0 && (
            <Link
              href={`/buyer/payments`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#ffffff',
                backgroundColor: '#15803d',
                padding: '6px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)',
              }}
            >
              <span>Pay Now</span>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => onViewDetails ? onViewDetails(order) : null}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#374151',
            backgroundColor: '#fafaf7',
            border: '1px solid #e5e7eb',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
