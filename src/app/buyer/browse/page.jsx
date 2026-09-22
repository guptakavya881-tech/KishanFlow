'use client';

import React, { useState, useEffect, useTransition } from 'react';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import BuyerCropCard from '@/components/buyer/BuyerCropCard';
import CropDetailModal from '@/components/buyer/CropDetailModal';
import {
  Sprout,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function BuyerBrowsePage() {
  const [crops, setCrops] = useState([]);
  const [availableCropNames, setAvailableCropNames] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCropDetail, setSelectedCropDetail] = useState(null);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedCrop !== 'All') params.set('cropName', selectedCrop);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);
      if (selectedLocation !== 'All') params.set('location', selectedLocation);

      const res = await fetch(`/api/buyer/crops?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setCrops(json.data.crops || []);
        if (json.data.availableCropNames) {
          setAvailableCropNames(json.data.availableCropNames);
        }
        if (json.data.availableLocations) {
          setAvailableLocations(json.data.availableLocations);
        }
      } else {
        setError(json.error || 'Failed to load farmer produce listings.');
      }
    } catch (err) {
      console.error('Error loading crops:', err);
      setError('Network error while connecting to KishanFlow shared produce service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, [selectedCrop, selectedStatus, selectedLocation]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCrops();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCrop('All');
    setSelectedStatus('All');
    setSelectedLocation('All');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCrop !== 'All' ||
    selectedStatus !== 'All' ||
    selectedLocation !== 'All';

  return (
    <BuyerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Header Banner */}
        <div className="buyer-browse-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Sprout size={20} />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                Browse Agricultural Produce 🌾
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#4b5563', fontWeight: 500 }}>
              Explore produce currently registered by KishanFlow farmers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={fetchCrops}
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

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 800,
              color: '#15803d',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803d' }} />
              <span>{crops.length} {crops.length === 1 ? 'Produce Lot' : 'Produce Lots'} Listed</span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Search & Data-Driven Filters Card */}
        <div className="buyer-browse-filters-card">
          {/* Top Search & Location Row */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="buyer-search-input-wrapper">
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                id="buyer-crop-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search crops, location, or notes..."
                className="buyer-search-input-field"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    border: 'none',
                    background: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Location Filter Dropdown (Derived strictly from real farmer crops) */}
            {availableLocations.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} style={{ color: '#15803d' }} />
                <select
                  id="buyer-location-filter"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb',
                    backgroundColor: '#fafaf7',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
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

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Dynamic Crop Name Filter Pills (Only crops registered by real farmers!) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280', letterSpacing: '0.04em' }}>
                  Filter By Registered Crop:
                </span>
                <div className="buyer-filter-pill-row">
                  <button
                    type="button"
                    onClick={() => setSelectedCrop('All')}
                    className={`buyer-filter-pill ${selectedCrop === 'All' ? 'active' : ''}`}
                  >
                    All Crops
                  </button>
                  {availableCropNames.map((cropName) => (
                    <button
                      key={cropName}
                      type="button"
                      onClick={() => setSelectedCrop(cropName)}
                      className={`buyer-filter-pill ${selectedCrop === cropName ? 'active' : ''}`}
                    >
                      {cropName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Tabs: All, Available Now, Coming Soon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280', letterSpacing: '0.04em' }}>
                  Status:
                </span>
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
                        padding: '6px 12px',
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
              </div>
            </div>
          </div>
        </div>

        {/* 3. Crop Listings Grid or Empty States */}
        {loading && crops.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
            <p style={{ fontWeight: 600 }}>Loading verified produce listings from KishanFlow farmers...</p>
          </div>
        ) : error ? (
          <div className="buyer-empty-box">
            <div className="buyer-empty-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#991b1b', margin: 0 }}>
              Unable to load produce
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, maxWidth: '400px' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchCrops}
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
        ) : crops.length === 0 ? (
          // Dynamic truthful empty states based on filter vs total records
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
                  No farmer crop records matched your search &quot;{searchTerm}&quot; or chosen filters.
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
            ) : selectedStatus !== 'All' ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  No crops currently have this status
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
                  No registered farmer produce is currently flagged as &quot;{selectedStatus}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('All')}
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
                  Show All Produce
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
          <div className="buyer-crop-grid">
            {crops.map((crop) => (
              <BuyerCropCard
                key={crop.id}
                crop={crop}
                onSelect={(selected) => setSelectedCropDetail(selected)}
              />
            ))}
          </div>
        )}

        {/* 4. Crop Detail Modal */}
        {selectedCropDetail && (
          <CropDetailModal
            crop={selectedCropDetail}
            onClose={() => setSelectedCropDetail(null)}
          />
        )}
      </div>
    </BuyerLayout>
  );
}
