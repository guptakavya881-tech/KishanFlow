'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import WheatLogo from '@/components/WheatLogo';
import {
  Sprout,
  MapPin,
  Calendar,
  Clock,
  Users,
  Navigation,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Info,
  ShieldCheck,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react';

function ConfirmBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Actual Submitted & Selected Data
  const cropName = searchParams.get('cropName') || 'Wheat';
  const qty = searchParams.get('qty') || '50';
  const unit = searchParams.get('unit') || 'Quintal';
  const harvestDate = searchParams.get('harvestDate') || '';
  const centreId = searchParams.get('centreId') || 'centre-1';
  const centreName = searchParams.get('centreName') || 'Meerut Procurement Centre';
  const centreAddress =
    searchParams.get('centreAddress') || 'Mandi Samiti Compound, Delhi Road, Meerut, UP';
  const date = searchParams.get('date') || '18 September 2026';
  const timeSlot = searchParams.get('timeSlot') || '11:30 AM – 12:00 PM';
  const distance = searchParams.get('distance') || '8.4 km away';
  const queue = searchParams.get('queue') || 'Low Crowd (~18 mins wait)';

  const [loading, setLoading] = useState(false);
  const [existingConflict, setExistingConflict] = useState(null);
  const [error, setError] = useState('');

  // Handle Confirmed Booking Creation / Reschedule in Database
  const handleConfirmBooking = async (replaceExisting = false) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/farmer/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName,
          quantity: Number(qty) || 50,
          unit,
          centreId,
          centreName,
          centreAddress,
          date,
          timeSlot,
          estimatedWaitMins: 18,
          replaceExisting: Boolean(replaceExisting),
        }),
      });

      const data = await res.json();

      // Handle duplicate/existing booking gracefully with options
      if (res.status === 409 || data.code === 'EXISTING_BOOKING_FOUND') {
        setExistingConflict(data.existingBooking);
        return;
      }

      if (data.success && data.booking) {
        // Immediately navigate to BOOKING CONFIRMED screen with real data
        const b = data.booking;
        const params = new URLSearchParams({
          bookingId: (b.id || '').toString(),
          bookingNumber: b.bookingNumber || '',
          tokenNumber: b.tokenNumber || '',
          cropName: b.cropName || cropName,
          quantity: (b.quantity || qty).toString(),
          unit: b.unit || unit,
          centreName: b.centreName || centreName,
          centreAddress: b.centreAddress || centreAddress,
          date: b.date || date,
          timeSlot: b.timeSlot || timeSlot,
        });

        router.push(`/farmer/booking/confirmed?${params.toString()}`);
      } else {
        setError(data.error || 'Unable to confirm booking. Please try again.');
      }
    } catch (err) {
      console.error('Error confirming booking:', err);
      setError('Network connection error while reserving procurement slot.');
    } finally {
      setLoading(false);
    }
  };

  // URL parameters for "CHANGE SLOT" to preserve crop details
  const backToRecommendationUrl = `/farmer/recommendation?cropName=${encodeURIComponent(
    cropName
  )}&qty=${encodeURIComponent(qty)}&unit=${encodeURIComponent(unit)}&harvestDate=${encodeURIComponent(
    harvestDate
  )}`;

  return (
    <div className="booking-confirm-screen">
      <div className="booking-confirm-container">
        {/* Top Bar: Brand Pill + Quick Return */}
        <div className="booking-confirm-top-bar">
          <Link href={backToRecommendationUrl} className="booking-confirm-back-btn">
            <ArrowLeft size={16} />
            <span>← Change Slot</span>
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1.5px solid #e5e7eb',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <WheatLogo size={24} showText={false} href={null} />
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#15803d' }}>
              Kishan<span style={{ color: '#d97706' }}>Flow</span>
            </span>
          </div>
        </div>

        {/* Screen Heading Section */}
        <div className="booking-confirm-header">
          <span className="booking-confirm-pill">
            <ShieldCheck size={14} color="#047857" />
            <span>Procurement Review</span>
          </span>

          <h1 className="booking-confirm-title">CONFIRM YOUR BOOKING</h1>

          <p className="booking-confirm-subtitle">
            Please review your procurement details before confirming.
          </p>
        </div>



        {/* Error Notice */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: '16px',
              padding: '14px 18px',
              color: '#b91c1c',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ======================================================== */}
        {/* CARD 1: YOUR CROP                                       */}
        {/* ======================================================== */}
        <div className="booking-confirm-crop-card">
          <div className="booking-confirm-card-heading">
            <h2 className="booking-confirm-card-title">
              <Sprout size={18} color="#d97706" />
              <span>YOUR CROP</span>
            </h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>
              Farmer Submission
            </span>
          </div>

          <div className="booking-confirm-crop-grid">
            <div className="booking-confirm-crop-item">
              <span className="booking-confirm-crop-lbl">Crop</span>
              <span className="booking-confirm-crop-val">🌾 {cropName}</span>
            </div>

            <div className="booking-confirm-crop-item">
              <span className="booking-confirm-crop-lbl">Quantity</span>
              <span className="booking-confirm-crop-val">
                {qty} {unit}
              </span>
            </div>

            <div className="booking-confirm-crop-item">
              <span className="booking-confirm-crop-lbl">Expected Harvest</span>
              <span className="booking-confirm-crop-val" style={{ fontSize: '1rem' }}>
                {harvestDate || 'Ready for Immediate Procurement'}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2: YOUR SELECTED SLOT                              */}
        {/* ======================================================== */}
        <div className="booking-confirm-slot-card">
          <div className="booking-confirm-slot-heading">
            <h2 className="booking-confirm-slot-title">
              <MapPin size={18} color="#15803d" />
              <span>YOUR SELECTED SLOT</span>
            </h2>
            <span className="booking-confirm-slot-badge">
              ✓ Selected Option
            </span>
          </div>

          {/* Centre Details */}
          <div className="booking-confirm-slot-centre-block">
            <h3 className="booking-confirm-centre-name">{centreName}</h3>
            <span className="booking-confirm-centre-addr">
              <MapPin size={15} color="#15803d" />
              <span>{centreAddress}</span>
            </span>
          </div>

          {/* Metric Grid: Date, Time, Distance, Queue */}
          <div className="booking-confirm-slot-grid">
            <div className="booking-confirm-metric-cell">
              <span className="booking-confirm-metric-lbl">
                <Calendar size={13} color="#15803d" />
                <span>Date</span>
              </span>
              <span className="booking-confirm-metric-val green">{date}</span>
            </div>

            <div className="booking-confirm-metric-cell">
              <span className="booking-confirm-metric-lbl">
                <Clock size={13} color="#15803d" />
                <span>Time</span>
              </span>
              <span className="booking-confirm-metric-val">{timeSlot}</span>
            </div>

            <div className="booking-confirm-metric-cell">
              <span className="booking-confirm-metric-lbl">
                <Navigation size={13} color="#15803d" />
                <span>Distance</span>
              </span>
              <span className="booking-confirm-metric-val">{distance}</span>
            </div>

            <div className="booking-confirm-metric-cell">
              <span className="booking-confirm-metric-lbl">
                <Users size={13} color="#15803d" />
                <span>Queue</span>
              </span>
              <span className="booking-confirm-metric-val">{queue}</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* IMPORTANT NOTE                                           */}
        {/* ======================================================== */}
        <div className="booking-confirm-note-box">
          <Info size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
          <span>Please arrive at the procurement centre during your selected time slot.</span>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM BUTTONS                                           */}
        {/* ======================================================== */}
        <div className="booking-confirm-actions">
          <Link href={backToRecommendationUrl} className="booking-confirm-btn-secondary">
            <ArrowLeft size={16} />
            <span>← CHANGE SLOT</span>
          </Link>

          <button
            type="button"
            onClick={() => handleConfirmBooking(false)}
            className="booking-confirm-btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Confirming Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>CONFIRM BOOKING</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EXISTING BOOKING FOUND MODAL                             */}
      {/* ======================================================== */}
      {existingConflict && (
        <div className="booking-conflict-modal-backdrop">
          <div className="booking-conflict-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#ffedd5',
                  color: '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#9a3412' }}>
                  Existing booking found
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#7c2d12' }}>
                  An active procurement slot is already registered for <strong>{cropName}</strong>.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#fff7ed',
                border: '1.5px solid #fed7aa',
                borderRadius: '16px',
                padding: '16px 18px',
                fontSize: '0.88rem',
                color: '#431407',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9a3412', fontWeight: 600 }}>Currently Booked Centre:</span>
                <span style={{ fontWeight: 800 }}>{existingConflict.centreName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9a3412', fontWeight: 600 }}>Scheduled Slot:</span>
                <span style={{ fontWeight: 800 }}>
                  {existingConflict.date} • {existingConflict.timeSlot}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9a3412', fontWeight: 600 }}>Existing Token:</span>
                <span style={{ fontWeight: 800, color: '#c2410c' }}>{existingConflict.tokenNumber}</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', fontWeight: 600, lineHeight: 1.5 }}>
              Would you like to change your existing booking to this new slot?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => setExistingConflict(null)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #d1d5db',
                  color: '#4b5563',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                KEEP EXISTING BOOKING
              </button>

              <button
                type="button"
                onClick={() => handleConfirmBooking(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d, #14532d)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '14px',
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(21, 128, 61, 0.3)',
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Slot...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>CHANGE TO THIS SLOT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfirmBookingPage() {
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
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 800, fontSize: '1rem' }}>Loading Booking Review...</p>
          </div>
        </div>
      }
    >
      <ConfirmBookingContent />
    </Suspense>
  );
}
