'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Truck, MapPin, Calendar, ArrowRight } from 'lucide-react';

export default function OrderPreviewCard({ order }) {
  const {
    orderId,
    cropName,
    variety,
    quantity,
    totalAmount,
    status,
    centre,
    orderDate,
  } = order;

  // Status color logic
  const isConfirmed = status === 'Confirmed';
  const isReady = status === 'Ready for Dispatch';

  const statusBg = isConfirmed ? '#dbeafe' : isReady ? '#fef3c7' : '#fee2e2';
  const statusColor = isConfirmed ? '#1e40af' : isReady ? '#92400e' : '#991b1b';
  const statusBorder = isConfirmed ? '#bfdbfe' : isReady ? '#fde68a' : '#fecaca';

  return (
    <div className="buyer-order-card">
      <div>
        {/* Top Header: Order ID & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={16} />
            </span>
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#111827', display: 'block', lineHeight: 1.1 }}>
                {orderId}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 500 }}>
                {orderDate}
              </span>
            </div>
          </div>

          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: statusBg,
            color: statusColor,
            border: `1px solid ${statusBorder}`,
          }}>
            {status}
          </span>
        </div>

        {/* Crop & Quantity Row */}
        <div style={{
          backgroundColor: '#fafaf7',
          borderRadius: '12px',
          padding: '10px 12px',
          margin: '10px 0',
          border: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#111827', display: 'block' }}>
              {cropName}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>
              {variety}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#15803d', display: 'block' }}>
              {quantity}
            </span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4b5563' }}>
              {totalAmount}
            </span>
          </div>
        </div>

        {/* Centre Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#4b5563', marginBottom: '10px' }}>
          <MapPin size={13} style={{ color: '#15803d', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{centre}</span>
        </div>
      </div>

      {/* Footer / Track Button */}
      <div style={{
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={11} />
          Procurement active
        </span>

        <Link
          href={`/buyer/track-orders?id=${orderId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            fontWeight: 800,
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Truck size={13} />
          <span>Track Order</span>
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
