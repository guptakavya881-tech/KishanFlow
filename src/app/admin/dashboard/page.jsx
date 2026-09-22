'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  Building2,
  Sprout,
  Package,
  Clock,
  CheckCircle2,
  IndianRupee,
  Warehouse,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real admin dashboard data from backend
  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load administrative metrics.');
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError('Network error while connecting to KishanFlow service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Authenticated Admin Name (Dynamic from session)
  const adminName = user?.fullName || data?.admin?.fullName || 'System Administrator';

  // Statistics from real DB data
  const stats = data?.stats || {
    totalFarmers: 0,
    totalBuyers: 0,
    activeCrops: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedProcurement: 0,
    pendingPayments: 0,
    procurementCentres: 0,
  };

  const procurementOverview = data?.procurementOverview || {
    pending: 0,
    scheduled: 0,
    atCentre: 0,
    completed: 0,
  };

  const paymentOverview = data?.paymentOverview || {
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
    totalVolume: 0,
  };

  const recentOrders = data?.recentOrders || [];
  const usersOverview = data?.usersOverview || {
    farmersCount: 0,
    buyersCount: 0,
    recentFarmers: [],
    recentBuyers: [],
  };
  const procurementCentres = data?.procurementCentres || [];
  const recentActivity = data?.recentActivity || [];

  // Helper for Order status styling
  const getOrderStatusBadgeClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('REQUESTED') || s.includes('PENDING')) return 'requested';
    if (s.includes('CONFIRM') || s.includes('SCHEDULE')) return 'confirmed';
    if (s.includes('COMPLET') || s.includes('DELIVER')) return 'completed';
    if (s.includes('CANCEL')) return 'cancelled';
    return 'confirmed';
  };

  // Helper for Payment status styling
  const getPaymentStatusBadgeClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('PAID') || s.includes('RECEIVE') || s.includes('SUCCESS')) return 'paid';
    if (s.includes('FAIL')) return 'failed';
    return 'pending';
  };

  // Helper for Date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate total procurement pipeline count for progress bars
  const totalProcPipeline = Math.max(
    1,
    procurementOverview.pending +
      procurementOverview.scheduled +
      procurementOverview.atCentre +
      procurementOverview.completed
  );

  return (
    <AdminLayout>
      {/* Loading Skeleton View */}
      {loading && !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
          <div
            style={{
              height: '110px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d',
              gap: '12px',
              fontWeight: 700,
            }}
          >
            <RefreshCw size={22} className="animate-spin" />
            <span>Loading KishanFlow Administrative Intelligence...</span>
          </div>

          <div className="admin-stats-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                style={{
                  height: '130px',
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  border: '1.5px solid #e5e7eb',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Error Banner if any */}
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#b91c1c',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                style={{
                  background: 'none',
                  border: '1px solid #f87171',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: '#b91c1c',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. WELCOME SECTION                                       */}
          {/* ======================================================== */}
          <section className="admin-welcome-banner">
            <div className="admin-welcome-text">
              <span className="admin-welcome-badge">
                <Sparkles size={13} />
                System Administration • Real-time Operations
              </span>
              <h1>Welcome back, {adminName}</h1>
              <p>
                Monitor and manage KishanFlow agricultural procurement operations, mandi centres, and user transactions.
              </p>
            </div>

            <div className="admin-welcome-actions">
              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="admin-refresh-btn"
                title="Refresh metrics from database"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Live Refresh'}</span>
              </button>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 2. STATISTICS CARDS (8 REAL DATA METRICS)                */}
          {/* ======================================================== */}
          <section>
            <div className="admin-stats-grid">
              {/* 1. Total Farmers */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Total Farmers</span>
                  <div className="admin-stat-icon-wrap green">
                    <Users size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.totalFarmers}</div>
                <div className="admin-stat-desc">Registered farming partners</div>
              </div>

              {/* 2. Total Buyers */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Total Buyers</span>
                  <div className="admin-stat-icon-wrap amber">
                    <Building2 size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.totalBuyers}</div>
                <div className="admin-stat-desc">Institutional &amp; bulk buyers</div>
              </div>

              {/* 3. Active Crop Listings */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Active Crop Listings</span>
                  <div className="admin-stat-icon-wrap emerald">
                    <Sprout size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.activeCrops}</div>
                <div className="admin-stat-desc">Lots available for mandi procurement</div>
              </div>

              {/* 4. Total Orders */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Total Orders</span>
                  <div className="admin-stat-icon-wrap blue">
                    <Package size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.totalOrders}</div>
                <div className="admin-stat-desc">Total procurement orders placed</div>
              </div>

              {/* 5. Pending Orders */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Pending Orders</span>
                  <div className="admin-stat-icon-wrap amber">
                    <Clock size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.pendingOrders}</div>
                <div className="admin-stat-desc">In review or transit pipeline</div>
              </div>

              {/* 6. Completed Procurement */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Completed Procurement</span>
                  <div className="admin-stat-icon-wrap green">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.completedProcurement}</div>
                <div className="admin-stat-desc">Mandi weighment &amp; handovers done</div>
              </div>

              {/* 7. Pending Payments */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Pending Payments</span>
                  <div className="admin-stat-icon-wrap amber">
                    <IndianRupee size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.pendingPayments}</div>
                <div className="admin-stat-desc">Transactions awaiting settlement</div>
              </div>

              {/* 8. Procurement Centres */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Procurement Centres</span>
                  <div className="admin-stat-icon-wrap emerald">
                    <Warehouse size={20} />
                  </div>
                </div>
                <div className="admin-stat-val">{stats.procurementCentres}</div>
                <div className="admin-stat-desc">Active mandi hubs in network</div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 3. PROCUREMENT OVERVIEW                                  */}
          {/* ======================================================== */}
          <section className="admin-section-card">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  <Layers size={20} color="#15803d" />
                  Procurement Overview
                </h2>
                <p className="admin-section-sub">
                  Real-time progression of crop lots and orders across procurement lifecycle stages
                </p>
              </div>
            </div>

            <div className="admin-procurement-grid">
              {/* Stage 1: Pending */}
              <div className="admin-proc-card">
                <div className="admin-proc-top">
                  <span className="admin-proc-label">Pending Procurement</span>
                  <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 800 }}>Requested</span>
                </div>
                <div className="admin-proc-count">{procurementOverview.pending}</div>
                <div className="admin-proc-bar">
                  <div
                    className="admin-proc-fill"
                    style={{
                      width: `${Math.round((procurementOverview.pending / totalProcPipeline) * 100)}%`,
                      backgroundColor: '#f59e0b',
                    }}
                  />
                </div>
              </div>

              {/* Stage 2: Scheduled */}
              <div className="admin-proc-card">
                <div className="admin-proc-top">
                  <span className="admin-proc-label">Scheduled Procurement</span>
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 800 }}>Slot Booked</span>
                </div>
                <div className="admin-proc-count">{procurementOverview.scheduled}</div>
                <div className="admin-proc-bar">
                  <div
                    className="admin-proc-fill"
                    style={{
                      width: `${Math.round((procurementOverview.scheduled / totalProcPipeline) * 100)}%`,
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </div>
              </div>

              {/* Stage 3: At Procurement Centre */}
              <div className="admin-proc-card">
                <div className="admin-proc-top">
                  <span className="admin-proc-label">At Procurement Centre</span>
                  <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 800 }}>In Queue / Scale</span>
                </div>
                <div className="admin-proc-count">{procurementOverview.atCentre}</div>
                <div className="admin-proc-bar">
                  <div
                    className="admin-proc-fill"
                    style={{
                      width: `${Math.round((procurementOverview.atCentre / totalProcPipeline) * 100)}%`,
                      backgroundColor: '#8b5cf6',
                    }}
                  />
                </div>
              </div>

              {/* Stage 4: Completed Procurement */}
              <div className="admin-proc-card">
                <div className="admin-proc-top">
                  <span className="admin-proc-label">Completed Procurement</span>
                  <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 800 }}>Procured</span>
                </div>
                <div className="admin-proc-count">{procurementOverview.completed}</div>
                <div className="admin-proc-bar">
                  <div
                    className="admin-proc-fill"
                    style={{
                      width: `${Math.round((procurementOverview.completed / totalProcPipeline) * 100)}%`,
                      backgroundColor: '#16a34a',
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 4. RECENT ORDERS TABLE SECTION                           */}
          {/* ======================================================== */}
          <section className="admin-section-card">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  <Package size={20} color="#15803d" />
                  Recent Orders
                </h2>
                <p className="admin-section-sub">
                  Live buyer purchase orders and farmer fulfillment status in real-time
                </p>
              </div>

              <Link href="/admin/orders" className="admin-view-all-btn">
                <span>View All Orders</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <Package size={24} />
                </div>
                <p className="admin-empty-title">No orders yet 🌱</p>
                <p className="admin-empty-text">
                  Orders created by institutional buyers will be tracked here in real-time.
                </p>
              </div>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Crop</th>
                      <th>Buyer</th>
                      <th>Farmer</th>
                      <th>Quantity</th>
                      <th>Order Status</th>
                      <th>Payment Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className="admin-order-num">#{order.orderNumber}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#111827' }}>
                          {order.cropName}
                        </td>
                        <td>{order.buyerName}</td>
                        <td>{order.farmerName}</td>
                        <td style={{ fontWeight: 600 }}>
                          {order.quantity} {order.unit}
                        </td>
                        <td>
                          <span className={`admin-order-badge ${getOrderStatusBadgeClass(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-pay-badge ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ======================================================== */}
          {/* 5. PAYMENT OVERVIEW SECTION                              */}
          {/* ======================================================== */}
          <section className="admin-section-card">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  <IndianRupee size={20} color="#15803d" />
                  Payment Overview
                </h2>
                <p className="admin-section-sub">
                  Escrow and direct mandi settlement tracking from verified transactions
                </p>
              </div>

              {paymentOverview.totalVolume > 0 && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#15803d',
                  }}
                >
                  Total Volume Settled: ₹{paymentOverview.totalVolume.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="admin-payment-grid">
              {/* Pending */}
              <div className="admin-pay-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="admin-pay-card-top">
                  <span className="admin-pay-label">Pending</span>
                  <span className="admin-pay-count">{paymentOverview.pending.count} payments</span>
                </div>
                <div className="admin-pay-amount">
                  ₹{paymentOverview.pending.amount.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                  Awaiting buyer authorization
                </span>
              </div>

              {/* Processing */}
              <div className="admin-pay-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div className="admin-pay-card-top">
                  <span className="admin-pay-label">Processing</span>
                  <span className="admin-pay-count">{paymentOverview.processing.count} payments</span>
                </div>
                <div className="admin-pay-amount">
                  ₹{paymentOverview.processing.amount.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                  In bank clearance queue
                </span>
              </div>

              {/* Paid */}
              <div className="admin-pay-card" style={{ borderLeft: '4px solid #16a34a' }}>
                <div className="admin-pay-card-top">
                  <span className="admin-pay-label">Paid &amp; Settled</span>
                  <span className="admin-pay-count">{paymentOverview.paid.count} payments</span>
                </div>
                <div className="admin-pay-amount">
                  ₹{paymentOverview.paid.amount.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                  Successfully disbursed to farmers
                </span>
              </div>

              {/* Failed */}
              <div className="admin-pay-card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div className="admin-pay-card-top">
                  <span className="admin-pay-label">Failed</span>
                  <span className="admin-pay-count">{paymentOverview.failed.count} payments</span>
                </div>
                <div className="admin-pay-amount">
                  ₹{paymentOverview.failed.amount.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>
                  Declined or gateway timeout
                </span>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 6. USERS OVERVIEW (FARMERS & BUYERS)                     */}
          {/* ======================================================== */}
          <section className="admin-section-card">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  <Users size={20} color="#15803d" />
                  Users Overview
                </h2>
                <p className="admin-section-sub">
                  Registered agricultural stakeholders and verified user profiles
                </p>
              </div>
            </div>

            <div className="admin-two-col-grid">
              {/* Farmers Block */}
              <div className="admin-user-block">
                <div className="admin-user-block-header">
                  <div className="admin-user-title-wrap">
                    <div className="admin-stat-icon-wrap green" style={{ width: '36px', height: '36px' }}>
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#111827' }}>
                        Farmers Directory
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280' }}>
                        Active growers &amp; crop suppliers
                      </p>
                    </div>
                  </div>
                  <span className="admin-user-count-badge">{usersOverview.farmersCount}</span>
                </div>

                <div className="admin-user-sublist">
                  {usersOverview.recentFarmers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: '0.8rem' }}>
                      No farmers registered yet.
                    </div>
                  ) : (
                    usersOverview.recentFarmers.map((farmer) => (
                      <div key={farmer.id} className="admin-user-row">
                        <div>
                          <div className="admin-user-row-name">{farmer.fullName}</div>
                          <div className="admin-user-row-meta">
                            {farmer.location || 'Location not specified'} • {farmer.mobile || farmer.email}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700 }}>
                          Verified
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/admin/farmers"
                  className="admin-view-all-btn"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <span>View Farmers</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Buyers Block */}
              <div className="admin-user-block">
                <div className="admin-user-block-header">
                  <div className="admin-user-title-wrap">
                    <div className="admin-stat-icon-wrap amber" style={{ width: '36px', height: '36px' }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#111827' }}>
                        Buyers Directory
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#6b7280' }}>
                        Wholesalers, retailers, &amp; food mills
                      </p>
                    </div>
                  </div>
                  <span className="admin-user-count-badge" style={{ color: '#d97706' }}>
                    {usersOverview.buyersCount}
                  </span>
                </div>

                <div className="admin-user-sublist">
                  {usersOverview.recentBuyers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: '0.8rem' }}>
                      No buyers registered yet.
                    </div>
                  ) : (
                    usersOverview.recentBuyers.map((buyer) => (
                      <div key={buyer.id} className="admin-user-row">
                        <div>
                          <div className="admin-user-row-name">
                            {buyer.companyName || buyer.fullName}
                          </div>
                          <div className="admin-user-row-meta">
                            {buyer.location || 'Location not specified'} • {buyer.email || buyer.mobile}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700 }}>
                          Verified
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/admin/buyers"
                  className="admin-view-all-btn"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <span>View Buyers</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 7. PROCUREMENT CENTRES                                   */}
          {/* ======================================================== */}
          <section className="admin-section-card">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  <Warehouse size={20} color="#15803d" />
                  Procurement Centres
                </h2>
                <p className="admin-section-sub">
                  Active government &amp; APMC mandi centres handling crop arrivals
                </p>
              </div>

              <Link href="/admin/centres" className="admin-view-all-btn">
                <span>Manage Centres</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {procurementCentres.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <Warehouse size={24} />
                </div>
                <p className="admin-empty-title">No procurement centres added yet.</p>
                <p className="admin-empty-text">
                  Procurement centres configured in the mandi database will be displayed here.
                </p>
              </div>
            ) : (
              <div className="admin-centres-grid">
                {procurementCentres.map((centre) => {
                  const crowdClass = (centre.currentCrowd || 'Low').toLowerCase();
                  return (
                    <div key={centre.id} className="admin-centre-card">
                      <div>
                        <h3 className="admin-centre-name">{centre.name}</h3>
                        <p className="admin-centre-address">{centre.address}</p>
                      </div>

                      <div className="admin-centre-meta-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>
                            Crowd:
                          </span>
                          <span className={`admin-crowd-pill ${crowdClass}`}>
                            {centre.currentCrowd || 'Normal'}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700 }}>
                          {centre.availableSlotsCount || 0} Slots Available
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ======================================================== */}
          {/* 8. RECENT ACTIVITY SECTION                               */}
          {/* ======================================================== */}
          <section className="admin-section-card">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  <TrendingUp size={20} color="#15803d" />
                  Recent Activity
                </h2>
                <p className="admin-section-sub">
                  System events and verified operational milestones across the ecosystem
                </p>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">
                  <TrendingUp size={24} />
                </div>
                <p className="admin-empty-title">No recent activity.</p>
                <p className="admin-empty-text">
                  Events will stream in as users register and initiate orders.
                </p>
              </div>
            ) : (
              <div className="admin-activity-list">
                {recentActivity.map((act) => (
                  <div key={act.id} className="admin-activity-item">
                    <div className="admin-activity-left">
                      <div
                        className="admin-activity-dot"
                        style={{
                          backgroundColor:
                            act.badgeColor === 'green'
                              ? '#16a34a'
                              : act.badgeColor === 'amber'
                              ? '#d97706'
                              : act.badgeColor === 'blue'
                              ? '#2563eb'
                              : '#10b981',
                        }}
                      />
                      <div>
                        <h4 className="admin-activity-title">{act.title}</h4>
                        <p className="admin-activity-desc">{act.description}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f3f4f6',
                          color: '#4b5563',
                        }}
                      >
                        {act.badgeText}
                      </span>
                      <span className="admin-activity-time">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}
