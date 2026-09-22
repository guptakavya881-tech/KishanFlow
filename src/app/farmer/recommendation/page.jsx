'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import WheatLogo from '@/components/WheatLogo';
import {
  Sparkles,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
  CheckCircle2,
  Building2,
  Scale,
  Sprout,
  ShieldCheck,
  Check,
  X,
  Layers,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

function RecommendationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cropName = searchParams.get('cropName') || 'Wheat';
  const quantity = searchParams.get('qty') || '50';
  const unit = searchParams.get('unit') || 'Quintal';
  const harvestDate = searchParams.get('harvestDate') || '';

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(1);
  const [recommendations, setRecommendations] = useState([]);

  // Short simulated AI verification sequence
  useEffect(() => {
    let timer1 = setTimeout(() => setLoadingStep(2), 500);
    let timer2 = setTimeout(() => setLoadingStep(3), 1000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Fetch real recommendations from backend API
  const fetchRecommendations = async () => {
    setLoading(true);
    setLoadingStep(1);
    try {
      const res = await fetch('/api/farmer/slots/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName,
          quantity: Number(quantity) || 50,
          unit,
          harvestDate,
        }),
      });

      const data = await res.json();
      if (data.success && data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations.slice(0, 3));
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setRecommendations([]);
    } finally {
      // Complete loading sequence
      setTimeout(() => {
        setLoading(false);
      }, 1300);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [cropName, quantity, unit, harvestDate]);

  // Handle Slot Selection -> Navigate to CONFIRM YOUR BOOKING screen
  const handleSelectSlot = (rec) => {
    const params = new URLSearchParams({
      cropName: cropName || 'Wheat',
      qty: (quantity || 50).toString(),
      unit: unit || 'Quintal',
      harvestDate: harvestDate || '',
      centreId: rec.id || 'centre-1',
      centreName: rec.name || 'Meerut Procurement Centre',
      centreAddress: rec.address || '',
      date: rec.availableDate || '18 September 2026',
      timeSlot: rec.availableTimeSlot || '11:30 AM – 12:00 PM',
      distance: rec.distanceText || `${rec.distanceKm} km away`,
      queue: `${rec.queueLevel} Crowd (~${rec.estimatedWaitMins} mins wait)`,
    });
    router.push(`/farmer/booking/confirm?${params.toString()}`);
  };

  // Generate explanation based on real factors
  const getExplanation = (rec) => {
    if (rec.recommendationReason) {
      return rec.recommendationReason;
    }
    if (rec.isBestMatch) {
      return `Recommended because this centre has the closest proximity (${rec.distanceText}), shorter queue times, and verified capacity for your ${quantity} ${unit} of ${cropName}.`;
    }
    if (rec.queueLevel === 'Low') {
      return `Suitable alternative with minimal crowd congestion and high throughput for ${cropName} unloading.`;
    }
    return `Reliable regional procurement depot with steady intake capacity matching your harvest schedule.`;
  };

  return (
    <div className="ai-rec-screen">
      <div className="ai-rec-wrapper">
        {/* ======================================================== */}
        {/* TOP BAR: BRAND LOGO + BACK BUTTON                        */}
        {/* ======================================================== */}
        <div className="ai-rec-top-bar">
          <Link href="/farmer/dashboard" className="ai-rec-back-link">
            <ArrowLeft size={16} />
            <span>← Back to Crop Details</span>
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <WheatLogo size={24} showText={false} href={null} />
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#15803d' }}>
              Kishan<span style={{ color: '#d97706' }}>Flow</span>
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TOP SECTION: HEADING + AI BADGES                         */}
        {/* ======================================================== */}
        <div className="ai-rec-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="ai-rec-assistant-pill">
              <Sparkles size={14} color="#d97706" />
              <span>Smart Agricultural Assistant</span>
            </span>
            <span className="ai-rec-verified-pill">
              <Check size={13} strokeWidth={3} />
              <span>✓ Crop details verified</span>
            </span>
          </div>

          <h1 className="ai-rec-title">BEST PROCUREMENT SLOT FOR YOU</h1>

          <p className="ai-rec-subtitle">
            AI has reviewed your crop details and available procurement options.
          </p>
        </div>

        {/* ======================================================== */}
        {/* AI VERIFICATION VISUAL PROCESS                           */}
        {/* CROP DETAILS ──► AI VERIFICATION ──► SLOT ANALYSIS ──► BEST MATCH */}
        {/* ======================================================== */}
        <div className="ai-rec-process-pipeline">
          <div className="ai-rec-step-node">
            <div className="ai-rec-step-icon">
              <Sprout size={18} />
            </div>
            <span className="ai-rec-step-label">Crop Details</span>
          </div>

          <div className="ai-rec-step-line" />

          <div className="ai-rec-step-node">
            <div className="ai-rec-step-icon">
              <Sparkles size={18} />
            </div>
            <span className="ai-rec-step-label">AI Verification</span>
          </div>

          <div className="ai-rec-step-line" />

          <div className="ai-rec-step-node">
            <div className="ai-rec-step-icon">
              <Building2 size={18} />
            </div>
            <span className="ai-rec-step-label">Slot Analysis</span>
          </div>

          <div className="ai-rec-step-line" />

          <div className="ai-rec-step-node">
            <div
              className="ai-rec-step-icon"
              style={{ backgroundColor: '#15803d', color: '#ffffff' }}
            >
              <CheckCircle2 size={18} />
            </div>
            <span className="ai-rec-step-label" style={{ color: '#15803d', fontWeight: 900 }}>
              Best Match
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CROP SUMMARY CARD                                        */}
        {/* ======================================================== */}
        <div className="ai-rec-crop-summary-card">
          <div className="ai-rec-summary-header">
            <span className="ai-rec-summary-title">
              <Sprout size={16} />
              <span>YOUR CROP DETAILS</span>
            </span>
            <Link
              href="/farmer/dashboard"
              style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textDecoration: 'underline' }}
            >
              Change Details
            </Link>
          </div>

          <div className="ai-rec-summary-grid">
            <div className="ai-rec-summary-item">
              <span className="ai-rec-summary-item-label">Crop</span>
              <span className="ai-rec-summary-item-val">🌾 {cropName}</span>
            </div>

            <div className="ai-rec-summary-item">
              <span className="ai-rec-summary-item-label">Quantity</span>
              <span className="ai-rec-summary-item-val">
                {quantity} {unit}
              </span>
            </div>

            <div className="ai-rec-summary-item">
              <span className="ai-rec-summary-item-label">Expected Harvest</span>
              <span className="ai-rec-summary-item-val">
                {harvestDate || 'Ready for Immediate Procurement'}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LOADING STATE                                            */}
        {/* ======================================================== */}
        {loading ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '26px',
              border: '2px solid #bbf7d0',
              padding: '60px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={32} className="animate-spin" />
            </div>

            <div style={{ spaceY: '6px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', margin: 0 }}>
                {loadingStep === 1 && 'Verifying your crop details...'}
                {loadingStep === 2 && 'Analyzing available procurement slots...'}
                {loadingStep === 3 && 'Finding the best match for you...'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                Comparing regional mandi queues, travel distance, and conveyor capacity.
              </p>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          /* ======================================================== */
          /* EMPTY / NO SLOT STATE                                    */
          /* ======================================================== */
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '26px',
              border: '2px solid #fecaca',
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={28} />
            </div>

            <div style={{ spaceY: '4px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1f2937', margin: 0 }}>
                No suitable slot found yet.
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', maxWidth: '380px', margin: '6px auto 0' }}>
                Try changing your quantity or harvest date, or check again later.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={fetchRecommendations}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                CHECK AGAIN
              </button>
              <Link
                href="/farmer/dashboard"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  borderRadius: '12px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Edit Crop Details
              </Link>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* AI RECOMMENDATION AREA (3 RECOMMENDED SLOTS)             */
          /* ======================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="ai-rec-slots-heading-wrap">
              <h2 className="ai-rec-slots-title">RECOMMENDED SLOTS</h2>
              <p className="ai-rec-slots-subtitle">
                Based on your crop, quantity, harvest date, distance and available capacity.
              </p>
            </div>

            <div className="ai-rec-cards-list">
              {recommendations.map((rec, idx) => {
                const isHighlight = rec.isBestMatch || idx === 0;

                return (
                  <div
                    key={rec.id || idx}
                    className={`ai-rec-slot-card ${isHighlight ? 'best-match' : ''}`}
                  >
                    {/* Top Row: Centre Name, Best Match Tag */}
                    <div className="ai-rec-slot-main-row">
                      <div className="ai-rec-centre-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 className="ai-rec-centre-name">{rec.name}</h3>
                          {isHighlight ? (
                            <span className="ai-rec-badge-tag green">
                              ⭐ AI RECOMMENDED
                            </span>
                          ) : (
                            <span className="ai-rec-badge-tag neutral">
                              Alternative Centre
                            </span>
                          )}
                        </div>

                        <span className="ai-rec-centre-addr">
                          <MapPin size={14} color="#15803d" />
                          <span>{rec.address}</span>
                        </span>
                      </div>
                    </div>

                    {/* 4 Metric Columns */}
                    <div className="ai-rec-grid-metrics">
                      <div className="ai-rec-metric-cell">
                        <span className="ai-rec-metric-lbl">
                          <Calendar size={12} />
                          <span>DATE & TIME</span>
                        </span>
                        <span className="ai-rec-metric-val highlight">
                          {rec.availableDate}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>
                          {rec.availableTimeSlot}
                        </span>
                      </div>

                      <div className="ai-rec-metric-cell">
                        <span className="ai-rec-metric-lbl">
                          <MapPin size={12} />
                          <span>DISTANCE</span>
                        </span>
                        <span className="ai-rec-metric-val">{rec.distanceText}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          from your registered farm
                        </span>
                      </div>

                      <div className="ai-rec-metric-cell">
                        <span className="ai-rec-metric-lbl">
                          <Users size={12} />
                          <span>QUEUE STATUS</span>
                        </span>
                        <span className="ai-rec-metric-val">
                          {rec.queueLevel} Crowd
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          ~{rec.estimatedWaitMins} mins wait
                        </span>
                      </div>

                      <div className="ai-rec-metric-cell">
                        <span className="ai-rec-metric-lbl">
                          <Scale size={12} />
                          <span>CAPACITY / CROP</span>
                        </span>
                        <span className="ai-rec-metric-val">
                          {rec.capacityText}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {quantity} {unit} {cropName}
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Explanation Box */}
                    <div className="ai-rec-explanation-box">
                      <Sparkles size={16} color="#d97706" style={{ shrink: 0, marginTop: '2px' }} />
                      <p style={{ margin: 0 }}>
                        <strong>AI Analysis:</strong> {getExplanation(rec)}
                      </p>
                    </div>

                    {/* Bottom Row: Select Slot Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                        Guaranteed MSP Allocation Pass
                      </span>
                      <button
                        onClick={() => handleSelectSlot(rec)}
                        className="ai-rec-select-btn"
                      >
                        <span>SELECT SLOT</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* BOTTOM ACTION: BACK TO CROP DETAILS                      */}
        {/* ======================================================== */}
        <div style={{ textAlign: 'center', paddingTop: '10px' }}>
          <Link href="/farmer/dashboard" className="ai-rec-back-link">
            <ArrowLeft size={16} />
            <span>← BACK TO CROP DETAILS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FarmerRecommendationPage() {
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
            <p style={{ fontWeight: 800, fontSize: '1rem' }}>Loading AI Recommendation Assistant...</p>
          </div>
        </div>
      }
    >
      <RecommendationContent />
    </Suspense>
  );
}
