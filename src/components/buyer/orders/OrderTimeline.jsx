'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Circle,
  Building2,
  FileCheck,
  Calendar,
  Truck,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const STAGES = [
  { id: 'ORDER_REQUESTED', aliases: ['order_requested', 'order placed', 'order requested', 'requested'], title: 'Order Request Created', desc: 'Procurement order request submitted in KishanFlow' },
  { id: 'CONFIRMED', aliases: ['confirmed'], title: 'Order Confirmed', desc: 'Accepted and confirmed by registered farmer' },
  { id: 'PROCUREMENT_SCHEDULED', aliases: ['procurement_scheduled', 'procurement scheduled', 'scheduled'], title: 'Procurement Scheduled', desc: 'Mandi Samiti date and slot reserved' },
  { id: 'READY_FOR_PROCUREMENT', aliases: ['ready_for_procurement', 'ready for procurement', 'ready'], title: 'Ready for Procurement', desc: 'Produce staged and ready for weighment' },
  { id: 'AT_PROCUREMENT_CENTRE', aliases: ['at_procurement_centre', 'at procurement centre', 'at mandi'], title: 'At Procurement Centre', desc: 'Physical lot verified at designated APMC yard' },
  { id: 'WEIGHING', aliases: ['weighing', 'verification / weighing', 'verification_weighing'], title: 'Verification / Weighing', desc: 'Produce quality grading and official weighment' },
  { id: 'PROCUREMENT_COMPLETED', aliases: ['procurement_completed', 'procurement completed'], title: 'Procurement Completed', desc: 'Procurement receipt generated and confirmed' },
  { id: 'PAYMENT_RECEIVED', aliases: ['payment_received', 'payment received', 'paid', 'payment_completed'], title: 'Payment Received', desc: 'Direct bank transfer and procurement settlement completed' },
  { id: 'COMPLETED', aliases: ['completed', 'fulfilled'], title: 'Completed', desc: 'Order fulfilled and transaction completed' },
];

export default function OrderTimeline({ order }) {
  if (!order) return null;

  const isCancelled = order.status === 'Cancelled' || order.status === 'CANCELLED';
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];

  const currentStatusNorm = (order.status || '').toLowerCase().trim();
  const isPaid = (order.paymentStatus || '').toUpperCase() === 'PAID';

  const currentIndex = STAGES.findIndex(
    (s) => s.id.toLowerCase() === currentStatusNorm || s.aliases.some((a) => a.toLowerCase() === currentStatusNorm)
  );

  const displayStatus = currentStatusNorm === 'order_requested' || currentStatusNorm === 'order placed' || currentStatusNorm === 'order requested'
    ? 'Order Request Sent'
    : currentStatusNorm === 'confirmed'
    ? 'Confirmed'
    : order.status;

  return (
    <div className="buyer-timeline-container">
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', letterSpacing: '0.04em' }}>
            Live Procurement Tracking
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 0' }}>
            Order {order.orderNumber}
          </h2>
          <span style={{ fontSize: '0.84rem', color: '#6b7280', fontWeight: 500 }}>
            {order.cropName} • {order.quantity} {order.unit || 'kg'}
          </span>
        </div>

        <div>
          {isCancelled ? (
            <span className="buyer-order-badge status-cancelled">
              <XCircle size={14} />
              <span>Cancelled</span>
            </span>
          ) : currentStatusNorm === 'confirmed' ? (
            <span className="buyer-order-badge status-completed" style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 size={14} />
              <span>Confirmed</span>
            </span>
          ) : currentStatusNorm === 'order_requested' || currentStatusNorm === 'order placed' ? (
            <span className="buyer-order-badge status-pending">
              <Clock size={14} />
              <span>Order Request Sent</span>
            </span>
          ) : (
            <span className="buyer-order-badge status-progress">
              <Clock size={14} />
              <span>Current Stage: {displayStatus}</span>
            </span>
          )}
        </div>
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1.5px solid #fecaca',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#991b1b',
        }}>
          <XCircle size={24} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900 }}>This order has been cancelled</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#b91c1c' }}>
              Procurement allocation has been released. You can browse produce and submit a new request anytime.
            </p>
          </div>
        </div>
      )}

      {/* Mandi & Logistics Overview Box */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        backgroundColor: '#fafaf7',
        padding: '16px 18px',
        borderRadius: '16px',
        border: '1px solid #f3f4f6',
      }}>
        <div>
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
            Procurement Centre
          </span>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Building2 size={15} style={{ color: '#15803d' }} />
            {order.procurementCentre || 'Designated Mandi Samiti'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
            Expected Date
          </span>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Calendar size={15} style={{ color: '#d97706' }} />
            {order.expectedDate || 'Immediate'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
            Verification
          </span>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <ShieldCheck size={15} />
            Mandi Samiti Assured
          </span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0f172a', margin: '0 0 16px' }}>
          Procurement Lifecycle Progress
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {STAGES.map((stage, idx) => {
            // Strict payment completion logic (Requirement 17)
            let isCompleted;
            let isCurrent;

            if (stage.id === 'PAYMENT_RECEIVED') {
              // "Payment Received" must ONLY become completed after actual successful payment. Do NOT mark it automatically!
              isCompleted = !isCancelled && isPaid;
              isCurrent = !isCancelled && !isPaid && currentIndex >= 1;
            } else if (stage.id === 'COMPLETED') {
              isCompleted = !isCancelled && isPaid && currentStatusNorm === 'completed';
              isCurrent = !isCancelled && isPaid && currentStatusNorm === 'completed';
            } else {
              isCompleted = !isCancelled && (idx === 0 || (currentIndex >= idx && currentIndex !== -1));
              isCurrent = !isCancelled && (currentIndex === idx && idx > 0);
            }

            const isUpcoming = isCancelled || (!isCompleted && !isCurrent);

            // Match historical event if exists
            let matchedHistory = history.find(
              (h) => h.status && (
                h.status.toLowerCase() === stage.id.toLowerCase() ||
                stage.aliases.some((a) => a.toLowerCase() === h.status.toLowerCase())
              )
            ) || (idx === 0 && history.length > 0 ? history[0] : null);

            if (stage.id === 'PAYMENT_RECEIVED' && isPaid && (!matchedHistory || !matchedHistory.timestamp)) {
              matchedHistory = {
                status: 'PAYMENT_RECEIVED',
                timestamp: order.paidAt || order.updatedAt,
                note: 'Payment completed by buyer and confirmed.',
              };
            }

            return (
              <div key={stage.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                {/* Vertical Line Connector */}
                {idx < STAGES.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '17px',
                      top: '34px',
                      bottom: '-12px',
                      width: '2px',
                      backgroundColor: isCompleted && (idx < currentIndex || (idx === 0 && currentIndex >= 1)) ? '#16a34a' : '#e5e7eb',
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Step Icon */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? '#16a34a'
                      : isCurrent
                      ? '#dcfce7'
                      : '#f3f4f6',
                    color: isCompleted
                      ? '#ffffff'
                      : isCurrent
                      ? '#15803d'
                      : '#9ca3af',
                    border: isCurrent ? '2px solid #16a34a' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 2,
                    boxShadow: isCurrent ? '0 0 0 4px rgba(22, 163, 74, 0.15)' : 'none',
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} />
                  ) : isCurrent ? (
                    <Clock size={18} className="stroke-[2.5]" />
                  ) : (
                    <Circle size={12} />
                  )}
                </div>

                {/* Step Content */}
                <div style={{ paddingBottom: idx === STAGES.length - 1 ? '0' : '26px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.94rem',
                        fontWeight: isCurrent || isCompleted ? 800 : 600,
                        color: isCompleted ? '#0f172a' : isCurrent ? '#15803d' : '#6b7280',
                      }}
                    >
                      {stage.title}
                    </h4>

                    {matchedHistory && matchedHistory.timestamp ? (
                      <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>✓</span>
                        {new Date(matchedHistory.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#9ca3af', fontWeight: 600 }}>
                        ○ Pending
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>
                    {stage.desc}
                  </p>

                  {matchedHistory && matchedHistory.note && (
                    <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#15803d', fontStyle: 'italic' }}>
                      &quot;{matchedHistory.note}&quot;
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
