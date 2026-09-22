'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Warehouse,
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
  ShieldCheck,
  Building2,
  Users,
  Sprout,
  Check,
} from 'lucide-react';

export default function AdminCentresPage() {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCentreId, setSelectedCentreId] = useState(null);
  const [centreDetails, setCentreDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');

  // Procurement completion confirmation modal state
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const loadCentres = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/admin/centres?search=${encodeURIComponent(query)}` : '/api/admin/centres';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.centres) {
        setCentres(json.data.centres);
      }
    } catch (err) {
      console.error('Error fetching centres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCentres(search);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedCentreId) {
        closeDetails();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCentreId]);

  const openCentreDetails = async (id) => {
    setSelectedCentreId(id);
    setActiveTab('orders');
    setCentreDetails(null);
    setDetailsError(null);
    try {
      setDetailsLoading(true);
      const res = await fetch(`/api/admin/centres?id=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCentreDetails(json.data);
      } else {
        setDetailsError(json.error || 'Centre not found.');
      }
    } catch (err) {
      console.error('Error fetching centre details:', err);
      setDetailsError('Network or server error while retrieving centre details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedCentreId(null);
    setCentreDetails(null);
    setDetailsError(null);
  };

  const handleCompleteProcurement = async () => {
    if (!confirmingOrder) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeProcurement', orderId: confirmingOrder.id }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Procurement marked as completed for Order #${confirmingOrder.orderNumber}!`);
        // Refresh details and centres list
        if (selectedCentreId) {
          openCentreDetails(selectedCentreId);
        }
        loadCentres(search);
        setTimeout(() => {
          setConfirmingOrder(null);
          setActionMessage(null);
        }, 1500);
      } else {
        alert(json.error || 'Failed to mark procurement complete.');
      }
    } catch (err) {
      console.error('Error completing procurement:', err);
      alert('Network error while completing procurement.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getCrowdClass = (crowd) => {
    const c = String(crowd || '').toLowerCase();
    if (c.includes('high')) return 'high';
    if (c.includes('med')) return 'medium';
    return 'low';
  };

  const isEligibleForProcurement = (status) => {
    const s = (status || '').toUpperCase();
    return !['PROCUREMENT_COMPLETED', 'COMPLETED', 'CANCELLED'].includes(s);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="admin-page-title">Procurement Centres</h1>
              <span className="admin-count-pill">{centres.length} Mandi Hubs</span>
            </div>
            <p className="admin-page-subtitle">
              Monitor APMC mandi yards, active arrival slots, and real-time procurement pipelines
            </p>
          </div>

          {/* Search bar */}
          <div className="admin-search-wrapper">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by centre name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="admin-search-clear-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Centres Grid */}
        {loading ? (
          <div className="admin-loading-box">
            <RefreshCw size={22} className="animate-spin" />
            <span>Loading procurement centres...</span>
          </div>
        ) : centres.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Warehouse size={24} />
            </div>
            <p className="admin-empty-title">
              {search ? 'No procurement centres found.' : 'No procurement centres found.'}
            </p>
            <p className="admin-empty-text">
              {search
                ? `No procurement centre matched "${search}". Try searching with a different keyword.`
                : 'Procurement centres configured in the mandi network will appear here.'}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="admin-view-all-btn"
                style={{ marginTop: '12px' }}
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="admin-centres-grid">
            {centres.map((centre) => {
              const crowdClass = getCrowdClass(centre.currentCrowd);
              return (
                <div
                  key={centre.id}
                  className="admin-centre-card"
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: '#f0fdf4',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #bbf7d0',
                            flexShrink: 0,
                          }}
                        >
                          <Warehouse size={20} />
                        </div>
                        <div>
                          <h3 className="admin-centre-name">{centre.name}</h3>
                          <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700 }}>
                            {centre.distanceKm} km from Hub
                          </span>
                        </div>
                      </div>

                      <span className={`admin-crowd-pill ${crowdClass}`}>
                        {centre.currentCrowd || 'Normal'} Crowd
                      </span>
                    </div>

                    <p className="admin-centre-address" style={{ margin: '8px 0 14px' }}>
                      <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} />
                      {centre.address}
                    </p>

                    {/* Capacity Progress */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                        <span>Daily Intake Capacity</span>
                        <span>{centre.todayCapacityPercent || 0}%</span>
                      </div>
                      <div className="admin-proc-bar">
                        <div
                          className="admin-proc-fill"
                          style={{
                            width: `${Math.min(100, centre.todayCapacityPercent || 0)}%`,
                            backgroundColor: (centre.todayCapacityPercent || 0) > 85 ? '#ef4444' : '#16a34a',
                          }}
                        />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                        backgroundColor: '#fafaf9',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid #f3f4f6',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                          Assigned Orders
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {centre.assignedOrdersCount || 0}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                          Completed Orders
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#15803d' }}>
                          {centre.completedProcurementCount || 0}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                          Arrival Bookings
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#d97706' }}>
                          {centre.bookingsCount || 0}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                          Available Slots
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563eb' }}>
                          {centre.availableSlotsCount || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCentreDetails(centre.id)}
                    className="admin-entity-card-btn"
                    style={{ marginTop: 'auto' }}
                  >
                    <span>View Centre Details &amp; Orders</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Slide-over Drawer for Centre Details */}
        {selectedCentreId && (
          <div className="admin-drawer-overlay" onClick={closeDetails}>
            <div className="admin-drawer-panel" onClick={(e) => e.stopPropagation()}>
              {/* Drawer Header */}
              <div className="admin-drawer-header">
                <div>
                  <span className="admin-drawer-tag">Mandi Samiti Hub</span>
                  <h2 className="admin-drawer-name">
                    {centreDetails?.centre?.name || 'Procurement Centre'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="admin-drawer-close-btn"
                  title="Close details"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="admin-drawer-body">
                {detailsError ? (
                  <div className="admin-empty-state" style={{ padding: '36px 20px' }}>
                    <AlertCircle size={32} color="#dc2626" style={{ marginBottom: '10px' }} />
                    <p className="admin-empty-title" style={{ color: '#991b1b', fontSize: '1.05rem' }}>{detailsError}</p>
                    <p className="admin-empty-text">The requested procurement centre could not be found or loaded.</p>
                    <button
                      type="button"
                      onClick={closeDetails}
                      className="admin-drawer-cancel-btn"
                      style={{ marginTop: '16px' }}
                    >
                      Close Details
                    </button>
                  </div>
                ) : detailsLoading ? (
                  <div className="admin-loading-box">
                    <RefreshCw size={22} className="animate-spin" />
                    <span>Loading centre operations...</span>
                  </div>
                ) : (
                  <>
                    {/* Location & Capacity Strip */}
                    <div className="admin-drawer-summary-card">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#111827', fontSize: '0.92rem', fontWeight: 800 }}>
                            <Building2 size={16} color="#15803d" />
                            <span>{centreDetails?.centre?.name || 'Not available'}</span>
                          </div>
                          <span className={`admin-crowd-pill ${getCrowdClass(centreDetails?.centre?.currentCrowd)}`}>
                            {centreDetails?.centre?.currentCrowd || 'Normal'} Crowd
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#4b5563', fontSize: '0.82rem' }}>
                          <MapPin size={14} color="#15803d" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{centreDetails?.centre?.address || centreDetails?.centre?.location || 'Not available'}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '8px', borderTop: '1px solid #bbf7d0', marginTop: '4px', fontSize: '0.76rem' }}>
                          <div>
                            <span style={{ color: '#6b7280', display: 'block', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</span>
                            <span style={{ fontWeight: 800, color: '#15803d' }}>{centreDetails?.centre?.centreStatus || 'Active'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280', display: 'block', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Capacity</span>
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>{centreDetails?.centre?.todayCapacityPercent ?? 'Not available'}%</span>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280', display: 'block', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Available Slots</span>
                            <span style={{ fontWeight: 800, color: '#2563eb' }}>{centreDetails?.centre?.availableSlotsCount ?? 'Not available'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational Metrics Bar */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        backgroundColor: '#fafaf9',
                        border: '1px solid #f3f4f6',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Total Orders</span>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                          {centreDetails?.centre?.totalOrders ?? (centreDetails?.assignedOrders?.length || 0)}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Pending</span>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#d97706' }}>
                          {centreDetails?.centre?.pendingOrders ?? 0}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Completed</span>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#15803d' }}>
                          {centreDetails?.centre?.completedOrders ?? 0}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.64rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Current Queue</span>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#7c3aed' }}>
                          {centreDetails?.centre?.currentQueue ?? 0}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="admin-drawer-tabs">
                      <button
                        type="button"
                        className={`admin-drawer-tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                      >
                        <Package size={15} />
                        <span>Assigned Orders ({centreDetails?.assignedOrders?.length || 0})</span>
                      </button>
                      <button
                        type="button"
                        className={`admin-drawer-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                      >
                        <Calendar size={15} />
                        <span>Arrival Bookings ({centreDetails?.upcomingBookings?.length || 0})</span>
                      </button>
                    </div>

                    {/* Tab 1: Assigned Orders */}
                    {activeTab === 'orders' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {centreDetails?.assignedOrders?.length === 0 ? (
                          <div className="admin-empty-state" style={{ padding: '28px 16px' }}>
                            <Package size={26} color="#9ca3af" />
                            <p className="admin-empty-title" style={{ fontSize: '0.92rem' }}>No orders assigned to this centre yet.</p>
                            <p className="admin-empty-text">No real buyer purchase orders currently linked to this APMC mandi centre.</p>
                          </div>
                        ) : (
                          centreDetails.assignedOrders.map((order) => {
                            const isProcCompleted = order.status === 'PROCUREMENT_COMPLETED' || order.status === 'Procurement Completed';
                            const eligible = isEligibleForProcurement(order.status);
                            return (
                              <div key={order.id} className="admin-drawer-item-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                  <div>
                                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d' }}>
                                      #{order.orderNumber}
                                    </span>
                                    <h4 style={{ margin: '2px 0 0', fontSize: '0.98rem', fontWeight: 800, color: '#111827' }}>
                                      {order.cropName} • {order.quantity} {order.unit || 'kg'}
                                    </h4>
                                  </div>
                                  <span
                                    className={`admin-order-badge ${isProcCompleted ? 'completed' : 'confirmed'}`}
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {order.status.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                <div style={{ fontSize: '0.78rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                                  <div><strong>Buyer:</strong> {order.buyerCompany || order.buyerName || 'Registered Buyer'}</div>
                                  <div><strong>Farmer:</strong> {order.farmerName || 'Registered Farmer'} ({order.farmerMobile || '—'})</div>
                                  <div><strong>Ordered Date:</strong> {formatDate(order.createdAt)}</div>
                                </div>

                                {/* Procurement Completion Action */}
                                {eligible && (
                                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px', marginTop: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmingOrder(order)}
                                      className="admin-proc-complete-btn"
                                    >
                                      <CheckCircle2 size={14} />
                                      <span>Mark Procurement Complete</span>
                                    </button>
                                  </div>
                                )}
                                {isProcCompleted && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, paddingTop: '6px' }}>
                                    <CheckCircle2 size={14} />
                                    <span>Procurement Handover Completed</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Tab 2: Arrival Bookings */}
                    {activeTab === 'bookings' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {centreDetails?.upcomingBookings?.length === 0 ? (
                          <div className="admin-empty-state" style={{ padding: '24px 16px' }}>
                            <Calendar size={22} color="#9ca3af" />
                            <p className="admin-empty-title" style={{ fontSize: '0.9rem' }}>No arrival bookings</p>
                            <p className="admin-empty-text">No farmer mandi arrival slots reserved yet.</p>
                          </div>
                        ) : (
                          centreDetails.upcomingBookings.map((booking) => (
                            <div key={booking.id} className="admin-drawer-item-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#d97706' }}>
                                    Token #{booking.tokenNumber || booking.bookingNumber}
                                  </span>
                                  <h4 style={{ margin: '2px 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                                    {booking.cropName} • {booking.quantity} {booking.unit || 'kg'}
                                  </h4>
                                </div>
                                <span className="admin-crowd-pill low" style={{ fontSize: '0.68rem' }}>
                                  {booking.status || 'Confirmed'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                                <div><strong>Farmer:</strong> {booking.farmerName || 'Registered Farmer'}</div>
                                <div><strong>Slot:</strong> {booking.date} at {booking.timeSlot}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="admin-drawer-footer">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="admin-drawer-cancel-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Procurement Completion */}
        {confirmingOrder && (
          <div className="admin-modal-overlay" onClick={() => !actionLoading && setConfirmingOrder(null)}>
            <div className="admin-modal-panel" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="admin-stat-icon-wrap green" style={{ width: '38px', height: '38px' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="admin-modal-title">Confirm Procurement Completion</h3>
                    <p className="admin-modal-subtitle">Administrative Mandi Procurement Authority</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmingOrder(null)}
                  className="admin-drawer-close-btn"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="admin-modal-body">
                {actionMessage ? (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', textAlign: 'center', color: '#15803d', fontWeight: 700 }}>
                    <CheckCircle2 size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <span>{actionMessage}</span>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                      Are you sure you want to officially mark procurement as <strong>COMPLETED</strong> for this order?
                    </p>

                    <div style={{ backgroundColor: '#fafaf9', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Order Number:</span>
                        <span style={{ fontWeight: 800, color: '#15803d' }}>#{confirmingOrder.orderNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Produce:</span>
                        <span style={{ fontWeight: 700, color: '#111827' }}>{confirmingOrder.cropName} ({confirmingOrder.quantity} {confirmingOrder.unit || 'kg'})</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Farmer:</span>
                        <span style={{ fontWeight: 700 }}>{confirmingOrder.farmerName || 'Registered Farmer'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Buyer:</span>
                        <span style={{ fontWeight: 700 }}>{confirmingOrder.buyerCompany || confirmingOrder.buyerName || 'Registered Buyer'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Mandi Samiti Yard:</span>
                        <span style={{ fontWeight: 700 }}>{confirmingOrder.procurementCentre || 'Designated Centre'}</span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                      ✓ Produce weighment, moisture verification, and handover will be verified.
                      <br />
                      ✓ The exact order record will be set to <strong>PROCUREMENT_COMPLETED</strong>.
                      <br />
                      ✓ Real-time status will immediately reflect on the Buyer&apos;s and Farmer&apos;s dashboards.
                    </div>
                  </>
                )}
              </div>

              {!actionMessage && (
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setConfirmingOrder(null)}
                    className="admin-drawer-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleCompleteProcurement}
                    className="admin-proc-confirm-btn"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Confirm Procurement Complete</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
