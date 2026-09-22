'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_BUYER_PROFILE } from '@/data/buyerMockData';
import { ShieldCheck, Calendar, MapPin } from 'lucide-react';

export default function BuyerHero() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Good morning');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const formatted = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setCurrentDate(formatted);
  }, []);

  const companyName = user?.fullName || DEFAULT_BUYER_PROFILE.companyName;
  const location = user?.location || DEFAULT_BUYER_PROFILE.location;

  return (
    <div className="buyer-hero-banner">
      {/* Left Column: Welcome copy */}
      <div style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            backgroundColor: '#dcfce7',
            color: '#14532d',
            border: '1px solid #bbf7d0',
          }}>
            <ShieldCheck size={14} style={{ color: '#15803d' }} />
            Verified Institutional Buyer
          </span>

          {currentDate && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
            }}>
              <Calendar size={13} />
              {currentDate}
            </span>
          )}
        </div>

        <h1 className="buyer-hero-title">
          {greeting},{' '}
          <span>{companyName}</span>{' '}
          <span style={{ display: 'inline-block', fontSize: '1.6rem' }}>👋</span>
        </h1>

        <p className="buyer-hero-subtitle">
          Find quality agricultural produce and manage your procurement easily.
        </p>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#374151' }}>
            <MapPin size={14} style={{ color: '#15803d' }} />
            <span>{location}</span>
          </div>
          <span style={{ color: '#d1d5db' }}>•</span>
          <span style={{ color: '#15803d', fontWeight: 700 }}>
            Procurement Hub: Meerut Mandi Zone
          </span>
        </div>
      </div>

      {/* Right Column: Original Subtle Agricultural Vector Illustration */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '270px', height: '135px', overflow: 'hidden', borderRadius: '16px', userSelect: 'none' }}>
          <svg
            style={{ width: '100%', height: '100%' }}
            viewBox="0 0 280 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="heroHills" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dcfce7" />
                <stop offset="100%" stopColor="#86efac" />
              </linearGradient>
              <linearGradient id="heroWarehouse" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
            </defs>

            {/* Sun soft glow */}
            <circle cx="220" cy="40" r="28" fill="#fef08a" fillOpacity="0.45" />

            {/* Rolling Hills Background */}
            <path
              d="M 20 110 C 70 85, 120 100, 180 80 C 220 65, 260 85, 280 90 L 280 140 L 20 140 Z"
              fill="url(#heroHills)"
              opacity="0.8"
            />

            {/* Silo / Grain Storage Facility */}
            <g transform="translate(195, 48)">
              <rect x="0" y="20" width="30" height="52" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <path d="M 0 20 C 0 10, 30 10, 30 20 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              <line x1="0" y1="36" x2="30" y2="36" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="0" y1="52" x2="30" y2="52" stroke="#cbd5e1" strokeWidth="1" />
            </g>

            {/* Modern Mandi Warehouse Building */}
            <g transform="translate(130, 68)">
              <rect x="0" y="16" width="58" height="38" rx="2" fill="url(#heroWarehouse)" stroke="#d97706" strokeWidth="1" />
              <polygon points="0,16 29,2 58,16" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
              <rect x="20" y="28" width="18" height="26" rx="1" fill="#15803d" />
              <rect x="23" y="32" width="12" height="22" rx="1" fill="#166534" />
            </g>

            {/* Stacked Crates of Farm Produce */}
            <g transform="translate(75, 96)">
              <rect x="0" y="12" width="22" height="15" rx="1.5" fill="#fcd34d" stroke="#d97706" strokeWidth="0.9" />
              <circle cx="6" cy="11" r="3.5" fill="#16a34a" />
              <circle cx="11" cy="10" r="3.5" fill="#22c55e" />
              <circle cx="16" cy="11" r="3.5" fill="#16a34a" />

              <rect x="24" y="12" width="22" height="15" rx="1.5" fill="#fde68a" stroke="#d97706" strokeWidth="0.9" />
              <circle cx="30" cy="11" r="3.5" fill="#eab308" />
              <circle cx="35" cy="10" r="3.5" fill="#f59e0b" />
              <circle cx="40" cy="11" r="3.5" fill="#eab308" />

              <rect x="12" y="-2" width="22" height="15" rx="1.5" fill="#fed7aa" stroke="#ea580c" strokeWidth="0.9" />
              <circle cx="17" cy="-3" r="3.5" fill="#ea580c" />
              <circle cx="23" cy="-4" r="3.5" fill="#f97316" />
              <circle cx="29" cy="-3" r="3.5" fill="#ea580c" />
            </g>

            {/* Golden Wheat Stalks Silhouette on foreground */}
            <g transform="translate(18, 70)" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round">
              <path d="M 12 55 Q 16 35 22 15" />
              <path d="M 22 15 Q 15 22 12 24" stroke="#d97706" strokeWidth="1" />
              <path d="M 22 15 Q 26 23 27 26" stroke="#d97706" strokeWidth="1" />
              <path d="M 19 25 Q 12 30 10 32" stroke="#d97706" strokeWidth="1" />
              <path d="M 19 25 Q 24 32 25 34" stroke="#d97706" strokeWidth="1" />

              <path d="M 32 55 Q 36 38 42 20" />
              <path d="M 42 20 Q 36 26 34 28" stroke="#d97706" strokeWidth="1" />
              <path d="M 42 20 Q 46 27 47 30" stroke="#d97706" strokeWidth="1" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
