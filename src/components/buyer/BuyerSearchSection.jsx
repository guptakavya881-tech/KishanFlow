'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

export default function BuyerSearchSection() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/buyer/browse?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/buyer/browse');
    }
  };

  const handleQuickFilter = (query) => {
    router.push(`/buyer/browse?cropName=${encodeURIComponent(query)}`);
  };

  return (
    <div className="buyer-search-banner">
      {/* Soft background SVG decorative shapes */}
      <div style={{
        position: 'absolute',
        top: '-32px',
        right: '-32px',
        width: '240px',
        height: '240px',
        backgroundColor: 'rgba(74, 222, 128, 0.12)',
        borderRadius: '50%',
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '750px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            backgroundColor: 'rgba(21, 128, 61, 0.6)',
            color: '#bbf7d0',
            border: '1px solid rgba(134, 239, 172, 0.3)',
          }}>
            <Sparkles size={12} style={{ color: '#fde047' }} />
            Direct Mandi Procurement
          </span>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Find Agricultural Produce
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#dcfce7', fontWeight: 400, maxWidth: '560px', opacity: 0.9 }}>
          Search available crops from verified procurement centres with instant quality grading.
        </p>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="buyer-search-form">
          <div className="buyer-search-input-wrap">
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              id="buyer-dashboard-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for wheat, paddy, maize..."
              className="buyer-search-input"
            />
          </div>

          <button
            type="submit"
            className="buyer-search-btn"
          >
            <span>Browse Available Produce</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Browse Produce Links */}
        <div className="buyer-quick-filters">
          <span style={{ fontSize: '0.78rem', color: '#dcfce7', fontWeight: 700, marginRight: '4px' }}>
            Quick Filter:
          </span>
          <button
            type="button"
            onClick={() => router.push('/buyer/browse?status=Available+Now')}
            className="buyer-filter-pill-btn"
          >
            <span>🌾</span>
            <span>Available Now</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/buyer/browse?status=Coming+Soon')}
            className="buyer-filter-pill-btn"
          >
            <span>🌱</span>
            <span>Coming Soon</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/buyer/browse')}
            className="buyer-filter-pill-btn"
          >
            <span>🔍</span>
            <span>All Produce Lots</span>
          </button>
        </div>
      </div>
    </div>
  );
}
