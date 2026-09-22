'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Sprout,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Calendar,
  X,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Building2,
  Users,
  Warehouse,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function AdminCropsPage() {
  const [crops, setCrops] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCrops: 0,
    readyCount: 0,
    nearlyReadyCount: 0,
    growingCount: 0,
    totalQuantityKg: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadCrops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);

      const res = await fetch(`/api/admin/crops?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCrops(json.data.crops || []);
        if (json.data.metrics) setMetrics(json.data.metrics);
      }
    } catch (err) {
      console.error('Error loading admin crops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, [selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCrops();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCropDetails = async (id) => {
    setSelectedCropId(id);
    try {
      setDetailsLoading(true);
      const res = await fetch(`/api/admin/crops?id=${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCropDetails(json.data);
      }
    } catch (err) {
      console.error('Error fetching crop details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedCropId(null);
    setCropDetails(null);
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('ready for procurement')) {
      return {
        label: 'Ready for Procurement (Available Now)',
        className: 'status-badge-ready',
        bg: '#f0fdf4',
        color: '#15803d',
        border: '#bbf7d0',
      };
    }
    if (s.includes('nearly ready')) {
      return {
        label: 'Nearly Ready (Coming Soon)',
        className: 'status-badge-nearly',
        bg: '#fefce8',
        color: '#854d0e',
        border: '#fef08a',
      };
    }
    return {
      label: 'Growing (Not Available)',
      className: 'status-badge-growing',
      bg: '#f1f5f9',
      color: '#475569',
      border: '#cbd5e1',
    };
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
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
                <Sprout size={22} />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Crop Listings Management 🌾
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b' }}>
              Real-time oversight of all farmer crop lots registered across KishanFlow mandis.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCrops}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Top Summary Metrics */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
              <Sprout size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Registered Crops</span>
              <span className="admin-stat-value">{metrics.totalCrops}</span>
              <span className="admin-stat-subtext">Real farmer listings</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Ready for Procurement</span>
              <span className="admin-stat-value">{metrics.readyCount}</span>
              <span className="admin-stat-subtext">Available for buyer purchase</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}>
              <Clock size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Nearly Ready</span>
              <span className="admin-stat-value">{metrics.nearlyReadyCount}</span>
              <span className="admin-stat-subtext">Coming soon to mandi</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
              <TrendingUp size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Total Volume (kg)</span>
              <span className="admin-stat-value">{(metrics.totalQuantityKg || 0).toLocaleString('en-IN')}</span>
              <span className="admin-stat-subtext">Across all active lots</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="admin-filter-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by crop, farmer name, location, or centre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
              style={{ width: '100%', paddingLeft: '40px' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Crops' },
              { id: 'Ready for Procurement', label: 'Ready for Procurement' },
              { id: 'Nearly Ready', label: 'Nearly Ready' },
              { id: 'Growing', label: 'Growing' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`admin-filter-tab ${selectedStatus === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Crops Table */}
        <div className="admin-table-container">
          {loading && crops.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
              <p style={{ fontWeight: 600 }}>Loading real farmer crop listings...</p>
            </div>
          ) : crops.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Sprout size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                {selectedStatus === 'Ready for Procurement'
                  ? 'No crops are ready for procurement yet.'
                  : search
                  ? 'No matching crops found'
                  : 'No crop listings available yet.'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                {selectedStatus === 'Ready for Procurement'
                  ? 'Once crops reach harvest readiness, they will appear here for buyer allocation.'
                  : search
                  ? 'Try adjusting your search criteria or clear status filters.'
                  : 'Once farmers add crops for procurement, they will appear here.'}
              </p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Crop &amp; Lot</th>
                  <th>Registered Farmer</th>
                  <th>Quantity Available</th>
                  <th>Harvest Status</th>
                  <th>Expected Harvest</th>
                  <th>Designated Centre</th>
                  <th>Orders &amp; Lots</th>
                  <th>Listing Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((crop) => {
                  const statusInfo = getStatusBadge(crop.harvestStatus);
                  const isReady = crop.harvestStatus === 'Ready for Procurement';
                  return (
                    <tr key={crop.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: '#f0fdf4',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}>
                            <Sprout size={18} />
                          </div>
                          <div>
                            <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.92rem' }}>
                              {crop.name}
                            </strong>
                            <span style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'monospace' }}>
                              {crop.lotId || `LOT-KF-${String(crop.id).padStart(4, '0')}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.88rem' }}>
                          {crop.farmerName || 'Not available'}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={11} /> {crop.farmerLocation || 'Not available'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                          {crop.quantity ? Number(crop.quantity).toLocaleString('en-IN') : 'Not available'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '4px' }}>
                          {crop.unit || 'kg'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
                          {crop.expectedHarvestDate || 'Immediate'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.86rem', color: '#334155', fontWeight: 600 }}>
                          {crop.procurementCentre || 'APMC Mandi Samiti'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: crop.ordersCount > 0 ? '#15803d' : '#64748b',
                          }}>
                            <Package size={12} />
                            {crop.ordersCount ?? 0} {crop.ordersCount === 1 ? 'order' : 'orders'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {crop.lotCount || (crop.ordersCount > 0 ? crop.ordersCount : 1)} {crop.lotCount === 1 ? 'lot' : 'lots'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: isReady ? '#dcfce7' : '#fef9c3',
                          color: isReady ? '#15803d' : '#854d0e',
                        }}>
                          {crop.listingStatus || (isReady ? 'Available Now' : 'Coming Soon')}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          id={`view-lots-${crop.id}`}
                          onClick={() => openCropDetails(crop.id)}
                          className="admin-table-action-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            border: '1.5px solid #15803d',
                            color: '#15803d',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          <span>View Lots</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Slide-over Drawer for Crop Details */}
        {selectedCropId && (
          <div className="admin-modal-overlay" onClick={closeDetails}>
            <div
              className="admin-detail-drawer"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '540px' }}
            >
              <div className="admin-drawer-header">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Crop Lots &amp; Listing Breakdown
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {cropDetails?.crop?.lotId || `LOT-KF-${String(selectedCropId).padStart(4, '0')}`}
                  </span>
                </div>
                <button type="button" onClick={closeDetails} className="admin-drawer-close-btn">
                  <X size={18} />
                </button>
              </div>

              <div className="admin-drawer-content">
                {detailsLoading ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#15803d' }} />
                    <p style={{ fontWeight: 600 }}>Loading lot breakdown...</p>
                  </div>
                ) : cropDetails?.crop ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Crop Overview Card */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                          {cropDetails.crop.name}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          backgroundColor: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                        }}>
                          {cropDetails.crop.harvestStatus}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            Available Quantity
                          </span>
                          <strong style={{ display: 'block', fontSize: '1.1rem', color: '#0f172a' }}>
                            {cropDetails.crop.quantity} {cropDetails.crop.unit || 'kg'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            Expected Harvest
                          </span>
                          <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a' }}>
                            {cropDetails.crop.expectedHarvestDate || 'Immediate'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            Designated Centre
                          </span>
                          <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>
                            {cropDetails.crop.procurementCentre || 'APMC Mandi Samiti'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            Listing Status
                          </span>
                          <strong style={{ display: 'block', fontSize: '0.9rem', color: '#15803d' }}>
                            {cropDetails.crop.listingStatus || 'Available Now'}
                          </strong>
                        </div>
                      </div>

                      {cropDetails.crop.notes && (
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            Farmer Notes:
                          </span>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#334155' }}>
                            {cropDetails.crop.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Farmer Information Card */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                        Registered Farmer
                      </span>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                        {cropDetails.crop.farmerName || 'Not available'}
                      </strong>
                      <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                        Mobile: {cropDetails.crop.farmerMobile || 'Not available'}
                      </span>
                      <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                        Email: {cropDetails.crop.farmerEmail || 'Not available'}
                      </span>
                      <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                        Location: {cropDetails.crop.farmerLocation || 'Not available'}
                      </span>
                    </div>

                    {/* Lots & Orders Placed Against This Specific Farmer Crop */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                          Crop Lots &amp; Orders ({cropDetails.lots?.length || cropDetails.orders?.length || 0})
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700 }}>
                          Real Associated Records
                        </span>
                      </div>

                      {(cropDetails.lots && cropDetails.lots.length > 0) || (cropDetails.orders && cropDetails.orders.length > 0) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(cropDetails.lots || cropDetails.orders).map((lot, idx) => {
                            const isProcCompleted = (lot.procurementStatus || lot.status) === 'PROCUREMENT_COMPLETED' || (lot.procurementStatus || lot.status) === 'COMPLETED';
                            return (
                              <div
                                key={lot.id || lot.orderId || idx}
                                style={{
                                  padding: '14px 16px',
                                  borderRadius: '14px',
                                  backgroundColor: '#ffffff',
                                  border: '1.5px solid #e2e8f0',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        backgroundColor: '#f1f5f9',
                                        color: '#334155',
                                        fontFamily: 'monospace',
                                        fontWeight: 800,
                                        fontSize: '0.76rem',
                                      }}>
                                        {lot.lotId || `LOT-KF-${String(cropDetails.crop.id).padStart(4, '0')}`}
                                      </span>
                                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                                        {lot.orderId || lot.orderNumber || 'KF-ORD-DIRECT'}
                                      </strong>
                                    </div>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                                      Buyer: <strong>{lot.buyerName || 'Verified Buyer'}</strong> • Farmer: {lot.farmerName || cropDetails.crop.farmerName}
                                    </span>
                                  </div>

                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    backgroundColor: isProcCompleted ? '#dcfce7' : '#f1f5f9',
                                    color: isProcCompleted ? '#15803d' : '#475569',
                                  }}>
                                    {lot.procurementStatus || lot.status}
                                  </span>
                                </div>

                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: '8px',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  backgroundColor: '#f8fafc',
                                  fontSize: '0.78rem',
                                  color: '#475569',
                                }}>
                                  <div><strong>Quantity:</strong> {lot.quantity} {lot.unit || 'kg'}</div>
                                  <div><strong>Procurement Centre:</strong> {lot.procurementCentre || cropDetails.crop.procurementCentre || 'APMC Mandi'}</div>
                                  <div><strong>Order Status:</strong> {lot.orderStatus || lot.status || 'CONFIRMED'}</div>
                                  <div><strong>Payment Status:</strong> {lot.paymentStatus || 'Pending'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{
                          padding: '24px 16px',
                          textAlign: 'center',
                          borderRadius: '12px',
                          backgroundColor: '#f8fafc',
                          border: '1.5px dashed #cbd5e1',
                        }}>
                          <Package size={24} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                          <p style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 600, margin: 0 }}>
                            No lots available for this crop.
                          </p>
                          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                            Primary listing lot {cropDetails.crop.lotId || `LOT-KF-${String(cropDetails.crop.id).padStart(4, '0')}`} has no orders placed yet.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#dc2626' }}>Unable to load crop lot details.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
