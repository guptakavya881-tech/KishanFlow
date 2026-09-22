'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Building2,
  Search,
  Package,
  IndianRupee,
  MapPin,
  Mail,
  Phone,
  X,
  ChevronRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  // Load buyers list
  const loadBuyers = async (query = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/admin/buyers?search=${encodeURIComponent(query)}` : '/api/admin/buyers';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.buyers) {
        setBuyers(json.data.buyers);
      }
    } catch (err) {
      console.error('Error fetching buyers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyers(search);
  }, [search]);

  // Load specific buyer details
  const openBuyerDetails = async (id) => {
    setSelectedBuyerId(id);
    setActiveTab('orders');
    try {
      setDetailsLoading(true);
      const res = await fetch(`/api/admin/buyers?id=${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBuyerDetails(json.data);
      }
    } catch (err) {
      console.error('Error fetching buyer details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedBuyerId(null);
    setBuyerDetails(null);
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
              <h1 className="admin-page-title">Buyers Directory</h1>
              <span className="admin-count-pill amber">{buyers.length} Registered</span>
            </div>
            <p className="admin-page-subtitle">
              Verified institutional buyers, wholesalers, and commercial food processors
            </p>
          </div>

          {/* Search bar */}
          <div className="admin-search-wrapper">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by name, company, email, mobile..."
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

        {/* Buyers Grid / Cards View */}
        {loading ? (
          <div className="admin-loading-box">
            <RefreshCw size={22} className="animate-spin" />
            <span>Loading registered buyers...</span>
          </div>
        ) : buyers.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Building2 size={24} />
            </div>
            <p className="admin-empty-title">
              {search ? 'No buyers found.' : 'No buyers registered yet.'}
            </p>
            <p className="admin-empty-text">
              {search
                ? `No registered buyer matched "${search}". Try searching with a different term.`
                : 'Commercial and institutional buyers registered through the Buyer portal will appear here.'}
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
            {buyers.map((buyer) => (
              <div
                key={buyer.id}
                className="admin-entity-card"
                onClick={() => openBuyerDetails(buyer.id)}
              >
                <div className="admin-entity-card-top">
                  <div className="admin-entity-avatar amber">
                    {(buyer.companyName || buyer.fullName).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <h3 className="admin-entity-name">{buyer.companyName || buyer.fullName}</h3>
                      <span className="admin-status-badge active">{buyer.accountStatus}</span>
                    </div>
                    {buyer.companyName && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
                        Contact: {buyer.fullName}
                      </div>
                    )}
                    <div className="admin-entity-id">ID: KF-BUYER-{String(buyer.id).padStart(4, '0')}</div>
                  </div>
                </div>

                <div className="admin-entity-info-list">
                  <div className="admin-entity-info-item">
                    <Phone size={14} />
                    <span>{buyer.mobile || 'No mobile listed'}</span>
                  </div>
                  <div className="admin-entity-info-item">
                    <Mail size={14} />
                    <span>{buyer.email || 'No email provided'}</span>
                  </div>
                  <div className="admin-entity-info-item">
                    <MapPin size={14} />
                    <span>{buyer.location || 'Location not specified'}</span>
                  </div>
                </div>

                <div className="admin-entity-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="admin-metric-chip blue">
                      <Package size={13} />
                      {buyer.orderCount} Orders
                    </span>
                    {buyer.totalPaidAmount > 0 && (
                      <span className="admin-metric-chip green">
                        <IndianRupee size={13} />
                        ₹{Number(buyer.totalPaidAmount).toLocaleString('en-IN')}
                      </span>
                    )}
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

        {/* Buyer Details Drawer / Modal */}
        {selectedBuyerId && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-backdrop" onClick={closeDetails} />
            <div className="admin-drawer-modal">
              {detailsLoading || !buyerDetails ? (
                <div className="admin-drawer-loading">
                  <RefreshCw size={24} className="animate-spin" />
                  <span>Retrieving buyer profile and purchase history...</span>
                </div>
              ) : (
                <>
                  {/* Drawer Header */}
                  <div className="admin-drawer-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="admin-entity-avatar amber" style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}>
                        {(buyerDetails.buyer.companyName || buyerDetails.buyer.fullName).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#111827' }}>
                          {buyerDetails.buyer.companyName || buyerDetails.buyer.fullName}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span className="admin-role-tag" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                            Buyer
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                            Member since {formatDate(buyerDetails.buyer.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={closeDetails} className="admin-drawer-close-btn">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Buyer Information Strip */}
                  <div className="admin-drawer-meta-grid">
                    <div>
                      <span className="meta-label">Contact Person</span>
                      <p className="meta-val">{buyerDetails.buyer.fullName || '—'}</p>
                    </div>
                    <div>
                      <span className="meta-label">Mobile</span>
                      <p className="meta-val">{buyerDetails.buyer.mobile || '—'}</p>
                    </div>
                    <div>
                      <span className="meta-label">Email</span>
                      <p className="meta-val">{buyerDetails.buyer.email || '—'}</p>
                    </div>
                    <div>
                      <span className="meta-label">Location</span>
                      <p className="meta-val">{buyerDetails.buyer.location || '—'}</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="admin-drawer-tabs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className={`admin-drawer-tab ${activeTab === 'orders' ? 'active' : ''}`}
                    >
                      <Package size={15} />
                      <span>Orders ({buyerDetails.orders.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('payments')}
                      className={`admin-drawer-tab ${activeTab === 'payments' ? 'active' : ''}`}
                    >
                      <IndianRupee size={15} />
                      <span>Payments ({buyerDetails.payments.length})</span>
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="admin-drawer-body">
                    {/* Tab 1: Orders */}
                    {activeTab === 'orders' && (
                      <div className="admin-drawer-list">
                        {buyerDetails.orders.length === 0 ? (
                          <div className="admin-empty-state" style={{ padding: '24px 16px' }}>
                            <p className="admin-empty-title">No orders placed</p>
                            <p className="admin-empty-text">This buyer has not placed any procurement orders yet.</p>
                          </div>
                        ) : (
                          buyerDetails.orders.map((order) => (
                            <div key={order.id} className="admin-drawer-item-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="admin-order-num">#{order.orderNumber}</span>
                                <span className="admin-order-badge confirmed">{order.status}</span>
                              </div>
                              <div style={{ marginTop: '6px', fontSize: '0.88rem', fontWeight: 800, color: '#111827' }}>
                                {order.cropName} • {order.quantity} {order.unit}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.78rem', color: '#6b7280' }}>
                                <span>Farmer: {order.farmerName || 'Farmer'}</span>
                                <span style={{ fontWeight: 800, color: '#15803d' }}>
                                  ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '4px' }}>
                                Placed on {formatDate(order.createdAt)} • Payment: {order.paymentStatus}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab 2: Payments */}
                    {activeTab === 'payments' && (
                      <div className="admin-drawer-list">
                        {buyerDetails.payments.length === 0 ? (
                          <div className="admin-empty-state" style={{ padding: '24px 16px' }}>
                            <p className="admin-empty-title">No payments recorded</p>
                            <p className="admin-empty-text">No payment settlements found for this buyer.</p>
                          </div>
                        ) : (
                          buyerDetails.payments.map((pay) => (
                            <div key={pay.id} className="admin-drawer-item-card">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>
                                  {pay.paymentNumber || `#PAY-${pay.id}`}
                                </span>
                                <span className="admin-pay-badge paid">{pay.status || 'PAID'}</span>
                              </div>
                              <p style={{ margin: '4px 0 2px', fontSize: '1rem', fontWeight: 900, color: '#111827' }}>
                                ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                              </p>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Method: {pay.paymentMethod || 'Mandi Escrow'} • {formatDate(pay.completedAt || pay.createdAt)}
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
