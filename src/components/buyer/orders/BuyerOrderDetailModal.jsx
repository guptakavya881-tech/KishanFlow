'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  Package,
  Calendar,
  Building2,
  MapPin,
  ShieldCheck,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function BuyerOrderDetailModal({ order, onClose, onCancelOrder }) {
  if (!order) return null;

  const isCancelled = order.status === 'Cancelled' || order.status === 'CANCELLED';
  const isProcCompleted = order.status === 'PROCUREMENT_COMPLETED' || order.status === 'Procurement Completed';
  const isCompleted = order.status === 'Completed' || order.status === 'COMPLETED' || isProcCompleted;
  const canCancel = !isCancelled && !isCompleted;
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
          border: '1.5px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                Order Details
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>
                {order.orderNumber}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Order Status & Volume Highlight */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            backgroundColor: '#fafaf7',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #f3f4f6',
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                Ordered Produce Volume
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d' }}>
                {order.quantity} {order.unit || 'kg'}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1f2937', display: 'block', marginTop: '2px' }}>
                {order.cropName}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                Current Status
              </span>
              <div style={{ marginTop: '4px' }}>
                <span className={`buyer-order-badge ${
                  isCancelled ? 'status-cancelled' :
                  isCompleted ? 'status-completed' :
                  (order.status || '').toLowerCase().includes('requested') || order.status === 'Order Placed' ? 'status-pending' :
                  'status-confirmed'
                }`}>
                  {isCancelled ? <XCircle size={13} /> : <Clock size={13} />}
                  <span>
                    {(order.status || '').toLowerCase().includes('requested') || order.status === 'Order Placed'
                      ? 'Order Request Sent'
                      : (order.status || '').toLowerCase() === 'confirmed'
                      ? 'Confirmed'
                      : isProcCompleted
                      ? 'Procurement Completed'
                      : order.status}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} /> Order Date
              </span>
              <span style={{ fontWeight: 800, color: '#1f2937' }}>
                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={15} /> Procurement Centre
              </span>
              <span style={{ fontWeight: 800, color: '#1f2937' }}>
                {order.procurementCentre || 'Designated Mandi Samiti'}
              </span>
            </div>

            {order.centreAddress && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} /> Centre Address
                </span>
                <span style={{ fontWeight: 600, color: '#4b5563', maxWidth: '240px', textAlign: 'right' }}>
                  {order.centreAddress}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} /> Expected Date
              </span>
              <span style={{ fontWeight: 800, color: '#1f2937' }}>
                {order.expectedDate || 'Immediate'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> Payment Status
              </span>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: (order.paymentStatus || '').toUpperCase() === 'PAID' ? '#15803d' : '#d97706',
                    backgroundColor: (order.paymentStatus || '').toUpperCase() === 'PAID' ? '#dcfce7' : '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    display: 'inline-block',
                  }}
                >
                  {(order.paymentStatus || '').toUpperCase() === 'PAID'
                    ? 'Paid'
                    : (order.paymentStatus || '').toUpperCase() === 'PROCESSING'
                    ? 'Processing'
                    : 'Pending'}
                </span>
                {typeof order.totalAmount === 'number' && order.totalAmount > 0 ? (
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace', marginTop: '2px' }}>
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                    Payment amount not available
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} /> Quality Assurance
              </span>
              <span style={{ fontWeight: 800, color: '#15803d' }}>
                Mandi Samiti Verified Lot
              </span>
            </div>
          </div>

          {/* Delivery / Procurement Notes if provided */}
          {order.deliveryNotes && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Procurement Instructions
              </span>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#1f2937', fontStyle: 'italic' }}>
                &quot;{order.deliveryNotes}&quot;
              </p>
            </div>
          )}

          {/* Status History */}
          <div>
            <h4 style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px' }}>
              Order Lifecycle Events
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((evt, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#fafaf7',
                    border: '1px solid #f3f4f6',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1f2937' }}>
                      {evt.status}
                    </span>
                    {evt.note && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#6b7280' }}>
                        {evt.note}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {new Date(evt.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#fafaf7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {canCancel ? (
            <button
              type="button"
              onClick={() => onCancelOrder ? onCancelOrder(order.id) : null}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: '1px solid #fecaca',
                cursor: 'pointer',
              }}
            >
              Cancel Order
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href={`/buyer/track-orders?orderId=${encodeURIComponent(order.orderNumber)}`}
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                fontWeight: 800,
                fontSize: '0.84rem',
                border: '1.5px solid #bbf7d0',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Truck size={15} />
              <span>Track Live</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
