'use client';

import React from 'react';
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Truck,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { PROCUREMENT_JOURNEY_STEPS } from '@/data/buyerMockData';

const STEP_ICONS = {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Truck,
  CreditCard,
  CheckCircle2,
};

export default function ProcurementJourney() {
  return (
    <div className="buyer-journey-box">
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803d' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Your Procurement Journey
            </h2>
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
            Transparent, direct-from-mandi procurement workflow powered by KishanFlow
          </p>
        </div>

        <span style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#15803d',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          padding: '4px 12px',
          borderRadius: '9999px',
        }}>
          6 Simple Steps
        </span>
      </div>

      {/* Workflow Visual Grid */}
      <div className="buyer-journey-grid">
        {PROCUREMENT_JOURNEY_STEPS.map((item) => {
          const Icon = STEP_ICONS[item.iconName] || Search;

          return (
            <div key={item.step} className="buyer-journey-step-card">
              {/* Step indicator & Icon */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #d1d5db',
                    color: '#374151',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.step}
                  </span>

                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={16} />
                  </div>
                </div>

                <h3 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {item.title}
                </h3>
              </div>

              <p style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.4, margin: '8px 0 0' }}>
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
