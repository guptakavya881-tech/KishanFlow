'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  Search,
  Sprout,
  Package,
  Calendar,
  MapPin,
  Mail,
  Phone,
  X,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('crops');

  // Load farmers list
  const loadFarmers = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/admin/farmers?search=${encodeURIComponent(query)}` : '/api/admin/farmers';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.farmers) {
        setFarmers(json.data.farmers);
      }
    } catch (err) {
      console.error('Error fetching farmers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers(search);
  }, [search]);

  // Load specific farmer details
  const openFarmerDetails = async (id) => {
    setSelectedFarmerId(id);
    setActiveTab('crops');
    try {
      setDetailsLoading(true);
      const res = await fetch(`/api/admin/farmers?id=${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFarmerDetails(json.data);
      }
    } catch (err) {
      console.error('Error fetching farmer details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedFarmerId(null);
    setFarmerDetails(null);
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

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="admin-page-title">Farmers Directory</h1>
              <span className="admin-count-pill">{farmers.length} Registered</span>
            </div>
            <p className="admin-page-subtitle">
              Verified agricultural producers and crop suppliers registered on KishanFlow
            </p>
          </div>

          {/* Search bar */}
          <div className="admin-search-wrapper">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by name, mobile, email..."
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

        {/* Farmers Grid / Table View */}
        {loading ? (
          <div className="admin-loading-box">
            <RefreshCw size={22} className="animate-spin" />
            <span>Loading registered farmers...</span>
          </div>
        ) : farmers.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Users size={24} />
            </div>
            <p className="admin-empty-title">
              {search ? 'No farmers found.' : 'No farmers registered yet.'}
            </p>
            <p className="admin-empty-text">
              {search
                ? `No registered farmer matched "${search}". Try searching by another keyword.`
                : 'Farmers registered through the KishanFlow Farmer portal will appear here.'}
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
          <div className="admin-entity-grid">
            {farmers.map((farmer) => (
              <div
                key={farmer.id}
                className="admin-entity-card"
                onClick={() => openFarmerDetails(farmer.id)}
              >
                <div className="admin-entity-card-top">
                  <div className="admin-entity-avatar green">
                    {farmer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <h3 className="admin-entity-name">{farmer.fullName}</h3>
                      <span className="admin-status-badge active">{farmer.accountStatus}</span>
                    </div>
                    <div className="admin-entity-id">ID: KF-FARM-{String(farmer.id).padStart(4, '0')}</div>
                  </div>
                </div>

                <div className="admin-entity-info-list">
                  <div className="admin-entity-info-item">
                    <Phone size={14} />
                    <span>{farmer.mobile || 'No mobile listed'}</span>
                  </div>
                  <div className="admin-entity-info-item">
                    <Mail size={14} />
                    <span>{farmer.email || 'No email provided'}</span>
                  </div>
                  <div className="admin-entity-info-item">
                    <MapPin size={14} />
                    <span>{farmer.location || 'Location not specified'}</span>
                  </div>
                </div>

                <div className="admin-entity-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="admin-metric-chip green">
                      <Sprout size={13} />
                      {farmer.cropCount} Crops
                    </span>
                    <span className="admin-metric-chip blue">
                      <Package size={13} />
                      {farmer.orderCount} Orders
                    </span>
                  </div>
                  <div className="admin-view-details-action">
                    <span>Details</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Farmer Details Drawer / Modal */}
        {selectedFarmerId && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-backdrop" onClick={closeDetails} />
            <div className="admin-drawer-modal">
              {detailsLoading || !farmerDetails ? (
                <div className="admin-drawer-loading">
                  <RefreshCw size={24} className="animate-spin" />
                  <span>Retrieving farmer profile &amp; crop records...</span>
                </div>
              ) : (
                <>
                  {/* Drawer Header */}
                  <div className="admin-drawer-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="admin-entity-avatar green" style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}>
                        {farmerDetails.farmer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#111827' }}>
                          {farmerDetails.farmer.fullName}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span className="admin-role-tag">Farmer</span>
                          <span style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                            Registered {formatDate(farmerDetails.farmer.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={closeDetails} className="admin-drawer-close-btn">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Farmer Information Strip */}
                  <div className="admin-drawer-meta-grid">
                    <div>
                      <span className="meta-label">Mobile</span>
                      <p className="meta-val">{farmerDetails.farmer.mobile || '—'}</p>
                    </div>
                    <div>
                      <span className="meta-label">Email</span>
                      <p className="meta-val">{farmerDetails.farmer.email || '—'}</p>
                    </div>
                    <div>
                      <span className="meta-label">Location</span>
                      <p className="meta-val">{farmerDetails.farmer.location || '—'}</p>
                    </div>
                    <div>
                      <span className="meta-label">Status</span>
                      <p className="meta-val" style={{ color: '#15803d', fontWeight: 800 }}>
                        {farmerDetails.farmer.accountStatus}
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="admin-drawer-tabs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('crops')}
                      className={`admin-drawer-tab ${activeTab === 'crops' ? 'active' : ''}`}
                    >
                      <Sprout size={15} />
                      <span>Crops ({farmerDetails.crops.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className={`admin-drawer-tab ${activeTab === 'orders' ? 'active' : ''}`}
                    >
                      <Package size={15} />
                      <span>Orders ({farmerDetails.orders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
                      className={`admin-drawer-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                    >
                      <Calendar size={15} />
                      <span>Mandi Bookings ({farmerDetails.bookings.length})</span>
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="admin-drawer-body">
                    {/* Tab 1: Crops */}
                    {activeTab === 'crops' && (
                      <div className="admin-drawer-list">
                        {farmerDetails.crops.length === 0 ? (
                          <div className="admin-empty-state" style={{ padding: '24px 16px' }}>
                            <p className="admin-empty-title">No crops listed</p>
                            <p className="admin-empty-text">This farmer has not added any crop lots yet.</p>
                          </div>
                        ) : (
                          farmerDetails.crops.map((crop) => (
                            <div key={crop.id} className="admin-drawer-item-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                                  {crop.name}
                                </h4>
                                <span className="admin-order-badge confirmed">
                                  {crop.harvestStatus}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.8rem', color: '#4b5563' }}>
                                <span>Quantity: <strong>{crop.quantity} {crop.unit}</strong></span>
                                <span>Harvest: {formatDate(crop.expectedHarvestDate)}</span>
                              </div>
                              {crop.notes && (
                                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                                  "{crop.notes}"
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab 2: Orders */}
                    {activeTab === 'orders' && (
                      <div className="admin-drawer-list">
                        {farmerDetails.orders.length === 0 ? (
                          <div className="admin-empty-state" style={{ padding: '24px 16px' }}>
                            <p className="admin-empty-title">No orders yet</p>
                            <p className="admin-empty-text">No buyers have placed orders with this farmer yet.</p>
                          </div>
                        ) : (
                          farmerDetails.orders.map((order) => (
                            <div key={order.id} className="admin-drawer-item-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="admin-order-num">#{order.orderNumber}</span>
                                <span className="admin-order-badge confirmed">{order.status}</span>
                              </div>
                              <div style={{ marginTop: '6px', fontSize: '0.86rem', fontWeight: 700, color: '#111827' }}>
                                {order.cropName} • {order.quantity} {order.unit}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.78rem', color: '#6b7280' }}>
                                <span>Buyer: {order.buyerName || 'Buyer'}</span>
                                <span style={{ fontWeight: 800, color: '#15803d' }}>
                                  ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab 3: Bookings */}
                    {activeTab === 'bookings' && (
                      <div className="admin-drawer-list">
                        {farmerDetails.bookings.length === 0 ? (
                          <div className="admin-empty-state" style={{ padding: '24px 16px' }}>
                            <p className="admin-empty-title">No mandi bookings</p>
                            <p className="admin-empty-text">No mandi slot bookings made by this farmer yet.</p>
                          </div>
                        ) : (
                          farmerDetails.bookings.map((b) => (
                            <div key={b.id} className="admin-drawer-item-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>
                                  Token {b.tokenNumber}
                                </span>
                                <span className="admin-order-badge completed">{b.status}</span>
                              </div>
                              <p style={{ margin: '4px 0 2px', fontSize: '0.88rem', fontWeight: 800, color: '#111827' }}>
                                {b.cropName} ({b.quantity} {b.unit})
                              </p>
                              <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
                                {b.centreName} • {b.date} ({b.timeSlot})
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
