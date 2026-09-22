'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_BUYER_PROFILE } from '@/data/buyerMockData';
import {
  Building2,
  MapPin,
  ShieldCheck,
  Calendar,
  Award,
  ArrowRight,
} from 'lucide-react';

export default function BuyerProfileCard() {
  const { user } = useAuth();

  const companyName = user?.companyName || user?.fullName || DEFAULT_BUYER_PROFILE.companyName;
  const buyerId = user?.id
    ? `KF-BUYER-${String(user.id).padStart(4, '0')}`
    : DEFAULT_BUYER_PROFILE.buyerId;
  const location = user?.location || DEFAULT_BUYER_PROFILE.location;
  const email = user?.email || DEFAULT_BUYER_PROFILE.email;

  return (
    <div className="buyer-widget-card" style={{ marginBottom: '20px' }}>
      {/* Header with avatar initial */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          backgroundColor: '#15803d',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: '1.2rem',
          boxShadow: '0 4px 8px rgba(21, 128, 61, 0.25)',
          border: '2px solid #bbf7d0',
          flexShrink: 0,
        }}>
          {companyName.charAt(0)}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 900,
              color: '#0f172a',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {companyName}
            </h3>
            <ShieldCheck size={16} style={{ color: '#15803d', flexShrink: 0 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#15803d',
              backgroundColor: '#dcfce7',
              padding: '1px 6px',
              borderRadius: '4px',
            }}>
              Institutional Buyer
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280' }}>
              {buyerId}
            </span>
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div style={{
        backgroundColor: '#fafaf7',
        borderRadius: '14px',
        padding: '12px 14px',
        border: '1px solid #f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '0.78rem',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
          <MapPin size={13} style={{ color: '#15803d', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#6b7280', width: '80px' }}>Location:</span>
          <span style={{ fontWeight: 800, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
          <Building2 size={13} style={{ color: '#15803d', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#6b7280', width: '80px' }}>Email:</span>
          <span style={{ fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
          <Calendar size={13} style={{ color: '#15803d', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#6b7280', width: '80px' }}>Since:</span>
          <span style={{ fontWeight: 600, color: '#1f2937' }}>{DEFAULT_BUYER_PROFILE.memberSince}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
          <Award size={13} style={{ color: '#d97706', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#6b7280', width: '80px' }}>GSTIN:</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1f2937', fontSize: '0.72rem' }}>
            {DEFAULT_BUYER_PROFILE.gstNumber}
          </span>
        </div>
      </div>

      {/* View Profile Action */}
      <Link
        href="/buyer/profile"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '10px',
          fontSize: '0.78rem',
          fontWeight: 800,
          color: '#1f2937',
          backgroundColor: '#f3f4f6',
          border: '1px solid #e5e7eb',
          textDecoration: 'none',
          boxSizing: 'border-box',
        }}
      >
        <span>View Profile</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
