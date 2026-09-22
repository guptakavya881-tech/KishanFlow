'use client';

import React, { useState, useEffect } from 'react';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import ProduceCard from '@/components/buyer/ProduceCard';
import CropDetailModal from '@/components/buyer/CropDetailModal';
import {
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Sprout,
  ArrowUpDown,
  X,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

export default function BuyerFindProducePage() {
  const [produceList, setProduceList] = useState([]);
  const [availableCropNames, setAvailableCropNames] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedProduceDetail, setSelectedProduceDetail] = useState(null);

  const fetchProduce = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedCrop !== 'All') params.set('cropName', selectedCrop);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedLocation !== 'All') params.set('location', selectedLocation);
      if (sortBy) params.set('sortBy', sortBy);

      const res = await fetch(`/api/buyer/crops?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setProduceList(json.data.crops || []);
        if (json.data.availableCropNames) {
          setAvailableCropNames(json.data.availableCropNames);
        }
        if (json.data.availableLocations) {
          setAvailableLocations(json.data.availableLocations);
        }
      } else {
        setError(json.error || 'Failed to load farmer produce records.');
      }
    } catch (err) {
      console.error('Error fetching produce:', err);
      setError('Network error while connecting to KishanFlow produce repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduce();
  }, [selectedCrop, selectedStatus, selectedLocation, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProduce();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCrop('All');
    setSelectedStatus('All');
    setSelectedLocation('All');
    setSortBy('recent');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCrop !== 'All' ||
    selectedStatus !== 'All' ||
    selectedLocation !== 'All' ||
    sortBy !== 'recent';

  return (
    <BuyerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Header Banner */}
        <div className="buyer-find-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Search size={22} className="stroke-[2.5]" />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                Find Produce
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#4b5563', fontWeight: 500 }}>
              Discover fresh produce registered by farmers and find the right produce for your requirements.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={fetchProduce}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e5e7eb',
                color: '#374151',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. Prominent Full-Width Search Bar */}
        <div className="buyer-find-search-bar">
          <Search
            size={22}
            style={{
              position: 'absolute',
              left: '18px',
              color: '#9ca3af',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            id="buyer-find-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search crop or produce..."
            className="buyer-find-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '18px',
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* 3. Filters & Controls Panel */}
        <div className="buyer-find-filters-panel">
          <div className="buyer-find-controls-row">
            {/* Left Controls: Crop, Status, Location */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              {/* Crop Filter Dropdown (Real farmer crops only) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sprout size={15} style={{ color: '#15803d' }} />
                <select
                  id="buyer-find-crop-filter"
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="buyer-find-select"
                >
                  <option value="All">All Crops</option>
                  {availableCropNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Availability Filter Toggle (Available Now, Coming Soon, All) */}
              <div style={{
                display: 'flex',
                backgroundColor: '#fafaf7',
                padding: '3px',
                borderRadius: '12px',
                border: '1.5px solid #e5e7eb',
              }}>
                {[
                  { id: 'All', label: 'All' },
                  { id: 'Available Now', label: 'Available Now' },
                  { id: 'Coming Soon', label: 'Coming Soon' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatus(tab.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      backgroundColor: selectedStatus === tab.id ? '#15803d' : 'transparent',
                      color: selectedStatus === tab.id ? '#ffffff' : '#4b5563',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Location Filter Dropdown (Real farmer locations only) */}
              {availableLocations.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} style={{ color: '#d97706' }} />
                  <select
                    id="buyer-find-location-filter"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="buyer-find-select"
                  >
                    <option value="All">All Locations</option>
                    {availableLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right Controls: Sort selector & Reset */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpDown size={15} style={{ color: '#6b7280' }} />
                <select
                  id="buyer-find-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="buyer-find-select"
                >
                  <option value="recent">Recently Added</option>
                  <option value="quantity-desc">Quantity: High to Low</option>
                  <option value="quantity-asc">Quantity: Low to High</option>
                  <option value="harvest-date">Harvest Date</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Result Count Summary Bar */}
        <div className="buyer-find-result-counter">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: produceList.length > 0 ? '#15803d' : '#9ca3af',
            }} />
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1f2937' }}>
              {produceList.length} {produceList.length === 1 ? 'produce listing found' : 'produce listings found'}
            </span>
          </div>

          {searchTerm && (
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Showing results for &quot;<strong style={{ color: '#0f172a' }}>{searchTerm}</strong>&quot;
            </span>
          )}
        </div>

        {/* 5. Produce Grid or Clean Empty States */}
        {loading && produceList.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
            <p style={{ fontWeight: 600 }}>Discovering fresh farmer produce listings...</p>
          </div>
        ) : error ? (
          <div className="buyer-empty-box">
            <div className="buyer-empty-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#991b1b', margin: 0 }}>
              Unable to discover produce
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, maxWidth: '400px' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchProduce}
              style={{
                marginTop: '8px',
                padding: '8px 18px',
                borderRadius: '10px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : produceList.length === 0 ? (
          <div className="buyer-empty-box">
            <div className="buyer-empty-icon-wrap">
              <Sprout size={32} />
            </div>

            {hasActiveFilters ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  No matching crops found
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
                  No farmer crop records matched your search &quot;{searchTerm}&quot; or chosen criteria.
                </p>
                <p style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 700, margin: 0 }}>
                  Try changing your search or filters.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    marginTop: '10px',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #bbf7d0',
                    color: '#15803d',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Reset All Filters
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  No crops available yet 🌱
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0, maxWidth: '460px', lineHeight: 1.5 }}>
                  Once farmers add crops for procurement, they will appear here.
                </p>
                <span style={{ fontSize: '0.82rem', color: '#6b7280', fontStyle: 'italic' }}>
                  Check back soon.
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="buyer-find-grid">
            {produceList.map((item) => (
              <ProduceCard
                key={item.id}
                produce={item}
                onViewDetails={(selected) => setSelectedProduceDetail(selected)}
              />
            ))}
          </div>
        )}

        {/* 6. Produce Detail Modal */}
        {selectedProduceDetail && (
          <CropDetailModal
            crop={selectedProduceDetail}
            onClose={() => setSelectedProduceDetail(null)}
          />
        )}
      </div>
    </BuyerLayout>
  );
}
