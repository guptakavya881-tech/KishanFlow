'use client';

import React, { useState } from 'react';
import PaymentCard from './PaymentCard';
import PaymentEmptyState from './PaymentEmptyState';
import { Search, Filter } from 'lucide-react';

export default function PaymentList({ payments = [] }) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = payments.filter((p) => {
    const norm = (p.status || '').toUpperCase().trim();

    if (filterStatus === 'Paid') {
      if (norm !== 'PAID') return false;
    } else if (filterStatus === 'Processing') {
      if (norm !== 'PROCESSING') return false;
    } else if (filterStatus === 'Failed') {
      if (norm !== 'FAILED') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCrop = (p.cropName || '').toLowerCase().includes(q);
      const matchOrder = (p.orderNumber || '').toLowerCase().includes(q);
      const matchPay = (p.paymentNumber || '').toLowerCase().includes(q);
      const matchFarmer = (p.farmerName || '').toLowerCase().includes(q);
      return matchCrop || matchOrder || matchPay || matchFarmer;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls Bar: Filters & Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', 'Paid', 'Processing', 'Failed'].map((tab) => {
            const isActive = filterStatus === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterStatus(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  backgroundColor: isActive ? '#15803d' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#475569',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab === 'All' ? 'All Payments' : tab}
              </button>
            );
          })}
        </div>

        {payments.length > 0 && (
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search by order or payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                fontSize: '0.8rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      {/* Grid or Empty */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {filtered.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      ) : (
        <PaymentEmptyState
          title={searchQuery || filterStatus !== 'All' ? 'No matching payment records' : 'No payments completed yet'}
          description={
            searchQuery || filterStatus !== 'All'
              ? 'Try adjusting your search query or filter tab to find previous transactions.'
              : 'Complete payments for your confirmed orders to see settlement receipts here.'
          }
          actionHref={searchQuery || filterStatus !== 'All' ? null : '/buyer/orders'}
        />
      )}
    </div>
  );
}
