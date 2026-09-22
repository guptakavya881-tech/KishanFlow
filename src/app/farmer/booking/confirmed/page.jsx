'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import WheatLogo from '@/components/WheatLogo';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Scale,
  Sprout,
  ShieldCheck,
  Ticket,
  ArrowRight,
  Printer,
  Home,
} from 'lucide-react';

function BookingConfirmedContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get('bookingId') || '';
  const bookingNumber = searchParams.get('bookingNumber') || 'KF2026-PENDING';
  const tokenNumber = searchParams.get('tokenNumber') || 'KF-000';
  const cropName = searchParams.get('cropName') || 'Wheat';
  const quantity = searchParams.get('quantity') || '50';
  const unit = searchParams.get('unit') || 'Quintal';
  const centreName = searchParams.get('centreName') || 'Meerut Procurement Centre';
  const centreAddress = searchParams.get('centreAddress') || 'Mandi Samiti Compound, Delhi Road, Meerut, UP';
  const date = searchParams.get('date') || '18 September 2026';
  const timeSlot = searchParams.get('timeSlot') || '11:30 AM – 12:00 PM';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="booking-confirmed-screen">
      <div className="booking-confirmed-container">
        {/* Top Bar: Brand */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              padding: '8px 18px',
              borderRadius: '9999px',
              border: '1.5px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            }}
          >
            <WheatLogo size={26} showText={false} href={null} />
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#15803d' }}>
              Kishan<span style={{ color: '#d97706' }}>Flow</span>
            </span>
          </div>
        </div>

        {/* Confirmed Card */}
        <div className="booking-confirmed-card">
          {/* Big Check Circle */}
          <div className="booking-confirmed-check-circle">
            <CheckCircle2 size={44} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="booking-confirmed-title">✓ BOOKING CONFIRMED</h1>
            <p className="booking-confirmed-subtitle">
              Your procurement slot has been successfully confirmed.
            </p>
          </div>

          {/* Digital Pass Card */}
          <div className="booking-confirmed-pass">
            <div className="booking-confirmed-pass-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={18} color="#86efac" />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', color: '#a7f3d0' }}>
                  OFFICIAL APMC PROCUREMENT PASS
                </span>
              </div>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                Guaranteed Slot
              </span>
            </div>

            <div className="booking-confirmed-pass-grid">
              <div>
                <span style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
                  TOKEN NUMBER
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '1.8rem', fontWeight: 900, color: '#fef08a', letterSpacing: '0.04em' }}>
                  {tokenNumber}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>
                  BOOKING ID
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
                  {bookingNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Procurement Specifications */}
          <div className="booking-confirmed-details-list">
            <div className="booking-confirmed-detail-row">
              <span className="booking-confirmed-dt-label">
                <Sprout size={16} color="#15803d" />
                <span>Crop</span>
              </span>
              <span className="booking-confirmed-dt-value">🌾 {cropName}</span>
            </div>

            <div className="booking-confirmed-detail-row">
              <span className="booking-confirmed-dt-label">
                <Scale size={16} color="#15803d" />
                <span>Quantity</span>
              </span>
              <span className="booking-confirmed-dt-value">
                {quantity} {unit}
              </span>
            </div>

            <div className="booking-confirmed-detail-row">
              <span className="booking-confirmed-dt-label">
                <MapPin size={16} color="#15803d" />
                <span>Procurement Centre</span>
              </span>
              <span className="booking-confirmed-dt-value" style={{ color: '#15803d', textAlign: 'right' }}>
                {centreName}
              </span>
            </div>

            <div className="booking-confirmed-detail-row">
              <span className="booking-confirmed-dt-label">
                <Calendar size={16} color="#15803d" />
                <span>Date</span>
              </span>
              <span className="booking-confirmed-dt-value">{date}</span>
            </div>

            <div className="booking-confirmed-detail-row">
              <span className="booking-confirmed-dt-label">
                <Clock size={16} color="#15803d" />
                <span>Time</span>
              </span>
              <span className="booking-confirmed-dt-value">{timeSlot}</span>
            </div>
          </div>

          {/* Soft Instructions Box */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '16px',
              padding: '14px 20px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: '#166534',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={20} color="#15803d" style={{ flexShrink: 0 }} />
            <span>
              Please present your <strong>Token #{tokenNumber}</strong> at the mandi entrance weighbridge. Your MSP price is protected upon arrival during your allocated slot.
            </span>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              width: '100%',
              flexWrap: 'wrap',
              paddingTop: '6px',
            }}
          >
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #d1d5db',
                color: '#374151',
                borderRadius: '14px',
                fontSize: '0.95rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
              }}
            >
              <Printer size={16} />
              <span>Print Gate Pass</span>
            </button>

            <Link
              href="/farmer/dashboard"
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #16a34a, #15803d, #14532d)',
                color: '#ffffff',
                borderRadius: '14px',
                fontSize: '0.95rem',
                fontWeight: 900,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(21, 128, 61, 0.3)',
              }}
            >
              <Home size={16} />
              <span>Farmer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fbf9f4',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', color: '#15803d' }}>
            <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>Loading confirmed booking...</p>
          </div>
        </div>
      }
    >
      <BookingConfirmedContent />
    </Suspense>
  );
}
