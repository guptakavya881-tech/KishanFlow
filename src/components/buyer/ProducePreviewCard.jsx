'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, MapPin, ShieldCheck, ArrowRight, Building2, Calendar } from 'lucide-react';

export default function ProducePreviewCard({ produce }) {
  const cropName = produce.cropName || produce.name || 'Crop';
  const lotId = produce.lotId || (produce.id ? `LOT-KF-${String(produce.id).padStart(4, '0')}` : null);
  const rawQty = produce.quantity !== undefined ? produce.quantity : produce.availableQuantity;
  const unit = produce.unit || 'kg';
  const formattedQty = typeof rawQty === 'number' ? `${rawQty.toLocaleString('en-IN')} ${unit}` : (rawQty || `0 ${unit}`);
  const status = produce.harvestStatus || produce.availabilityStatus || 'Ready for Procurement';
  const centre = produce.procurementCentre || produce.centre || 'Designated KishanFlow Mandi';
  const location = produce.location || 'Regional Mandi Zone';
  const expectedHarvest = produce.expectedHarvestDate || 'Immediate';
  const isAvailableNow = status === 'Ready for Procurement' || status === 'Available Now';

  return (
    <div className="buyer-produce-card">
      {/* Top row: Crop name & Status Badge */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: isAvailableNow ? '#f0fdf4' : '#fefce8',
              color: isAvailableNow ? '#15803d' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `1px solid ${isAvailableNow ? '#bbf7d0' : '#fef08a'}`,
            }}>
              <Sprout size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                {cropName}
              </h3>
              {lotId && (
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>
                  {lotId}
                </p>
              )}
            </div>
          </div>

          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: isAvailableNow ? '#dcfce7' : '#fef3c7',
            color: isAvailableNow ? '#14532d' : '#92400e',
            border: `1px solid ${isAvailableNow ? '#bbf7d0' : '#fde68a'}`,
            whiteSpace: 'nowrap',
          }}>
            {isAvailableNow ? 'Available Now' : 'Coming Soon'}
          </span>
        </div>

        {/* Quantity and Harvest timing */}
        <div style={{
          backgroundColor: '#fafaf7',
          borderRadius: '12px',
          padding: '10px 14px',
          margin: '12px 0',
          border: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
              Available Volume
            </span>
            <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#15803d' }}>
              {formattedQty}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
              Harvest
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginTop: '2px' }}>
              <Calendar size={12} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1f2937' }}>
                {expectedHarvest}
              </span>
            </div>
          </div>
        </div>

        {/* Procurement Centre & Location */}
        <div style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Building2 size={13} style={{ color: '#15803d', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{centre}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '0.72rem', marginTop: '3px' }}>
            <MapPin size={12} style={{ color: '#d97706' }} />
            <span>{location} • Verified Mandi Lot</span>
          </div>
        </div>
      </div>

      {/* Bottom row: Status & View Details Link */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={14} style={{ color: '#15803d' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d' }}>
            Direct Farmer Produce
          </span>
        </div>

        <Link
          href={`/buyer/browse?cropName=${encodeURIComponent(cropName)}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '10px',
            fontSize: '0.76rem',
            fontWeight: 800,
            backgroundColor: '#f0fdf4',
            color: '#15803d',
            border: '1.5px solid #bbf7d0',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
