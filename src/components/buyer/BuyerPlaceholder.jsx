'use client';

import React from 'react';
import Link from 'next/link';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';

export default function BuyerPlaceholder({
  icon: Icon,
  title,
  subtitle = 'Your agricultural procurement experience is being prepared.',
  description = 'This module will be available in the upcoming KishanFlow release with complete mandi integration, instant booking, and verified crop traceability.',
  badge = 'Coming Soon • Module In Development',
}) {
  return (
    <BuyerLayout>
      <div style={{ maxWidth: '640px', margin: '40px auto', width: '100%', boxSizing: 'border-box' }}>
        <div className="buyer-placeholder-card">
          {/* Subtle top accent gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #15803d 0%, #10b981 50%, #f59e0b 100%)',
          }} />

          {/* Icon bubble */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1.5px solid #bbf7d0',
          }}>
            {Icon ? <Icon size={36} className="stroke-[2.2]" /> : <Sparkles size={36} />}
          </div>

          {/* Badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            backgroundColor: '#dcfce7',
            color: '#14532d',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
            border: '1px solid #86efac',
          }}>
            <Clock size={13} />
            {badge}
          </span>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            {title}
          </h1>

          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#15803d', margin: '0 0 12px' }}>
            {subtitle}
          </p>

          <p style={{ fontSize: '0.88rem', color: '#6b7280', maxWidth: '460px', margin: '0 auto 28px', lineHeight: 1.5 }}>
            {description}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link
              href="/buyer/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
