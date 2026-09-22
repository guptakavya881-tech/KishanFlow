'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import {
  Sprout,
  Scale,
  Calendar,
  Sparkles,
  ArrowRight,
  LogOut,
  ChevronDown,
  Loader2,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

export default function FarmerCropDetailPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Form State
  const [cropType, setCropType] = useState('Wheat');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Quintal');
  const [harvestDate, setHarvestDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to login if unauthenticated once auth check finishes
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/farmer/login');
    }
  }, [user, authLoading, router]);

  const displayName = user?.fullName || 'Farmer';

  // Handle Find Best Slot CTA
  const handleFindBestSlot = async (e) => {
    e.preventDefault();
    setError('');

    const numQty = Number(quantity);
    if (!cropType) {
      setError('Please select a crop type.');
      return;
    }
    if (!quantity || isNaN(numQty) || numQty <= 0) {
      setError('Please enter a valid crop quantity.');
      return;
    }

    setLoading(true);

    try {
      // 1. Save crop to farmer's real database records
      await fetch('/api/farmer/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cropType,
          quantity: numQty,
          unit: unit,
          expectedHarvestDate: harvestDate || null,
          harvestStatus: 'Ready for Procurement',
        }),
      });

      // 2. Route directly to slot recommendation engine with parameters
      const params = new URLSearchParams({
        cropName: cropType,
        qty: numQty.toString(),
        unit: unit,
        harvestDate: harvestDate || '',
      });

      router.push(`/farmer/recommendation?${params.toString()}`);
    } catch (err) {
      console.error('Error finding best slot:', err);
      router.push(
        `/farmer/recommendation?cropName=${encodeURIComponent(cropType)}&qty=${numQty}&unit=${encodeURIComponent(unit)}&harvestDate=${encodeURIComponent(harvestDate || '')}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Save crop and return directly to My Crops list
  const handleSaveAndGoToCrops = async (e) => {
    e.preventDefault();
    setError('');

    const numQty = Number(quantity);
    if (!cropType) {
      setError('Please select a crop type.');
      return;
    }
    if (!quantity || isNaN(numQty) || numQty <= 0) {
      setError('Please enter a valid crop quantity.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/farmer/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cropType,
          quantity: numQty,
          unit: unit,
          expectedHarvestDate: harvestDate || null,
          harvestStatus: 'Ready for Procurement',
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/farmer/crops');
      } else {
        setError(data.error || 'Failed to save crop.');
      }
    } catch (err) {
      console.error('Error saving crop:', err);
      setError('Network error while saving crop.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="farmer-crop-screen">
      {/* Soft farm mist overlay for contrast */}
      <div className="farmer-crop-overlay" />

      {/* Minimal Clean Top Header Bar */}
      <header className="farmer-crop-header-nav">
        {/* KishanFlow Logo */}
        <div className="farmer-crop-brand-pill">
          <WheatLogo size={32} showText={false} href={null} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>
              <span style={{ color: '#15803d' }}>Kishan</span>
              <span style={{ color: '#d97706' }}>Flow</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.04em', marginTop: '2px' }}>
              From Farm to Future
            </span>
          </div>
        </div>

        {/* Farmer Info & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/farmer/crops"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '9999px',
              color: '#15803d',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Sprout size={14} />
            <span>My Crops</span>
          </Link>

          <div className="farmer-crop-user-pill">
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '9999px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}
            >
              {displayName.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1f2937', lineHeight: 1.1 }}>
                {displayName}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 700 }}>
                Verified Farmer
              </span>
            </div>
          </div>

          <button onClick={logout} className="farmer-crop-logout-btn" title="Sign out">
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN CENTERED CONTAINER */}
      <main
        className="farmer-crop-main-container"
        style={{
          maxWidth: '840px',
          width: '90%',
          backgroundColor: '#fffdf9',
          borderRadius: '28px',
          border: '2px solid #bbf7d0',
          boxShadow: '0 24px 50px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          padding: '44px 40px',
          margin: 'auto',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div className="farmer-crop-heading-wrap" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <span
              className="farmer-crop-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 14px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #86efac',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Sprout size={14} /> Smart Harvest Allocation
            </span>
          </div>

          <h1
            className="farmer-crop-title"
            style={{
              fontSize: '2.4rem',
              fontWeight: 900,
              color: '#14532d',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 8px 0',
            }}
          >
            ADD CROP DETAIL
          </h1>

          <p
            className="farmer-crop-subtitle"
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#4b5563',
              margin: 0,
            }}
          >
            Enter your crop information to find the best procurement slot.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: '14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        {/* Form with 4 Input Blocks */}
        <form onSubmit={handleFindBestSlot}>
          <div className="farmer-crop-grid">
            {/* BLOCK 1: TYPE OF CROP */}
            <div className="farmer-crop-block">
              <div className="farmer-crop-label-row">
                <label className="farmer-crop-label">
                  <Sprout size={16} />
                  <span>TYPE OF CROP</span>
                </label>
                <span className="farmer-crop-tag">Required</span>
              </div>

              <div className="farmer-crop-select-wrap">
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="farmer-crop-select"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Maize">Maize</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Barley">Barley</option>
                  <option value="Pulses">Pulses</option>
                </select>
                <div className="farmer-crop-select-icon">
                  <ChevronDown size={18} />
                </div>
              </div>

              <p className="farmer-crop-hint">Select the cultivated crop variety.</p>
            </div>

            {/* BLOCK 2: QUANTITY */}
            <div className="farmer-crop-block">
              <div className="farmer-crop-label-row">
                <label className="farmer-crop-label">
                  <Scale size={16} />
                  <span>QUANTITY</span>
                </label>
                <span className="farmer-crop-tag">Required</span>
              </div>

              <div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter Quantity"
                  className="farmer-crop-input"
                  required
                />
              </div>

              <p className="farmer-crop-hint">Estimated weight for mandi dispatch.</p>
            </div>

            {/* BLOCK 3: UNIT */}
            <div className="farmer-crop-block">
              <div className="farmer-crop-label-row">
                <label className="farmer-crop-label">
                  <CheckCircle2 size={16} />
                  <span>UNIT</span>
                </label>
                <span
                  className="farmer-crop-tag"
                  style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
                >
                  Standard
                </span>
              </div>

              <div className="farmer-crop-select-wrap">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="farmer-crop-select"
                >
                  <option value="Quintal">Quintal</option>
                  <option value="kg">kg</option>
                  <option value="Tonne">Tonne</option>
                </select>
                <div className="farmer-crop-select-icon">
                  <ChevronDown size={18} />
                </div>
              </div>

              <p className="farmer-crop-hint">Measurement unit accepted across APMC mandis.</p>
            </div>

            {/* BLOCK 4: EXPECTED HARVEST DATE */}
            <div className="farmer-crop-block">
              <div className="farmer-crop-label-row">
                <label className="farmer-crop-label">
                  <Calendar size={16} />
                  <span>EXPECTED HARVEST DATE</span>
                </label>
                <span
                  className="farmer-crop-tag"
                  style={{ backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}
                >
                  Optional
                </span>
              </div>

              <div>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="farmer-crop-input"
                />
              </div>

              <p className="farmer-crop-hint">Target date when crop will be packed and ready.</p>
            </div>
          </div>

          {/* Bottom: FIND BEST SLOT CTA */}
          <div className="farmer-crop-btn-wrap" style={{ textAlign: 'center', paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              className="farmer-crop-submit-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                maxWidth: '420px',
                padding: '18px 36px',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #14532d 100%)',
                color: '#ffffff',
                border: '2px solid rgba(134, 239, 172, 0.6)',
                borderRadius: '9999px',
                fontSize: '1.2rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: '0 12px 28px rgba(21, 128, 61, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>Finding Best Slot...</span>
                </>
              ) : (
                <>
                  <Sparkles size={22} color="#fef08a" fill="#fde047" />
                  <span>FIND BEST SLOT</span>
                  <ArrowRight size={22} />
                </>
              )}
            </button>

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleSaveAndGoToCrops}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  backgroundColor: '#ffffff',
                  color: '#15803d',
                  border: '1.5px solid #86efac',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.08)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sprout size={16} />
                <span>Save Crop &amp; Return to My Crops</span>
              </button>
            </div>

            <div className="farmer-crop-guarantee" style={{ marginTop: '14px', justifyContent: 'center' }}>
              <MapPin size={14} />
              <span>Real-Time Mandi Capacity &amp; Distance Routing</span>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
