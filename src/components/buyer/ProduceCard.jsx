'use client';

import React from 'react';
import { Sprout, MapPin, Calendar, ShieldCheck, ArrowRight, Building2, Clock, CheckCircle2 } from 'lucide-react';

export default function ProduceCard({ produce, onViewDetails }) {
  const {
    id,
    lotId,
    cropName,
    quantity,
    unit,
    harvestStatus,
    expectedHarvestDate,
    location,
    procurementCentre,
    availabilityStatus,
    verificationStatus,
    notes,
  } = produce;

  const isAvailableNow = harvestStatus === 'Ready for Procurement' || availabilityStatus === 'Available Now';
  const formattedQuantity = typeof quantity === 'number' ? quantity.toLocaleString('en-IN') : quantity;

  return (
    <div className="buyer-crop-card">
      <div>
        {/* Top Header: Crop Name, Lot ID & Availability Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              backgroundColor: isAvailableNow ? '#f0fdf4' : '#fefce8',
              color: isAvailableNow ? '#15803d' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `1px solid ${isAvailableNow ? '#bbf7d0' : '#fef08a'}`,
            }}>
              <Sprout size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                {cropName}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, letterSpacing: '0.02em' }}>
                {lotId || `LOT-KF-${String(id).padStart(4, '0')}`}
              </span>
            </div>
          </div>

          <div>
            {isAvailableNow ? (
              <span className="buyer-crop-badge-available">
                <CheckCircle2 size={12} />
                <span>Available Now</span>
              </span>
            ) : (
              <span className="buyer-crop-badge-coming-soon">
                <Clock size={12} />
                <span>Coming Soon</span>
              </span>
            )}
          </div>
        </div>

        {/* Quantity & Harvest Metric Box */}
        <div className="buyer-metric-box">
          <div>
            <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block', letterSpacing: '0.04em' }}>
              Available Quantity
            </span>
            <span style={{ fontSize: '1.18rem', fontWeight: 900, color: '#15803d' }}>
              {formattedQuantity} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4b5563' }}>{unit || 'kg'}</span>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block', letterSpacing: '0.04em' }}>
              Readiness / Harvest
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
              <Calendar size={13} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1f2937' }}>
                {expectedHarvestDate || 'Immediate'}
              </span>
            </div>
          </div>
        </div>

        {/* Location & Procurement Centre Details (Real Data Only) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', fontSize: '0.8rem' }}>
          {procurementCentre && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#374151' }}>
              <Building2 size={14} style={{ color: '#15803d', flexShrink: 0 }} />
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {procurementCentre}
              </span>
            </div>
          )}

          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#4b5563' }}>
              <MapPin size={14} style={{ color: '#d97706', flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>
                {location}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontSize: '0.74rem', fontWeight: 700, marginTop: '2px' }}>
            <ShieldCheck size={14} />
            <span>{verificationStatus || 'Verified Produce'} • Direct Farmer Record</span>
          </div>

          {notes && (
            <p style={{
              margin: '6px 0 0',
              fontSize: '0.76rem',
              color: '#6b7280',
              fontStyle: 'italic',
              lineHeight: 1.35,
              backgroundColor: '#f9fafb',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #f3f4f6',
            }}>
              &quot;{notes}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div style={{
        paddingTop: '14px',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isAvailableNow ? '#16a34a' : '#f59e0b',
          }} />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isAvailableNow ? '#16a34a' : '#b45309' }}>
            {harvestStatus}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails ? onViewDetails(produce) : null}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#15803d',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '7px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dcfce7';
            e.currentTarget.style.borderColor = '#86efac';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
            e.currentTarget.style.borderColor = '#bbf7d0';
          }}
        >
          <span>View Details</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
