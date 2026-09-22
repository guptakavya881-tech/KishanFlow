'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Building2,
  Users,
  X,
  RefreshCw,
  Calendar,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const PAYMENT_TABS = [
  { id: 'ALL', label: 'All Payments' },
  { id: 'PAID', label: 'Paid & Settled' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'FAILED', label: 'Failed' },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    totalPayments: 0,
    paidCount: 0,
    totalPaidAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    processingCount: 0,
    processingAmount: 0,
    failedCount: 0,
    failedAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPayments(json.data.payments || []);
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedPaymentId) {
        closeDetails();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPaymentId]);

  const openPaymentDetails = async (id) => {
    setSelectedPaymentId(id);
    setPaymentDetails(null);
    setDetailsError(null);
    try {
      setDetailsLoading(true);
      const res = await fetch(`/api/admin/payments?id=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPaymentDetails(json.data);
      } else {
        setDetailsError(json.error || 'Payment not found.');
      }
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setDetailsError('Network or server error while retrieving payment details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedPaymentId(null);
    setPaymentDetails(null);
    setDetailsError(null);
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

  const getPaymentStatusBadgeClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('PAID') || s.includes('RECEIVE') || s.includes('SUCCESS')) return 'paid';
    if (s.includes('FAIL')) return 'failed';
    if (s.includes('PROCESS')) return 'confirmed';
    return 'pending';
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="admin-page-title">Mandi Payments &amp; Settlements</h1>
              <span className="admin-count-pill">{payments.length} Records</span>
            </div>
            <p className="admin-page-subtitle">
              Monitor unified escrow and direct farmer DBT transfers across verified mandi purchase orders
            </p>
          </div>

          {/* Search bar */}
          <div className="admin-search-wrapper">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by Payment ID, order, buyer, farmer..."
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

        {/* Real Payment Metric Summary Cards */}
        <div className="admin-payment-grid">
          {/* Total Paid Volume */}
          <div className="admin-pay-card" style={{ borderLeft: '4px solid #16a34a' }}>
            <div className="admin-pay-card-top">
              <span className="admin-pay-label">Total Volume Settled</span>
              <span className="admin-pay-count">{metrics.paidCount} paid</span>
            </div>
            <div className="admin-pay-amount" style={{ color: '#15803d' }}>
              ₹{metrics.totalPaidAmount.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
              Disbursed directly to farmers
            </span>
          </div>

          {/* Pending */}
          <div className="admin-pay-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="admin-pay-card-top">
              <span className="admin-pay-label">Pending Payments</span>
              <span className="admin-pay-count">{metrics.pendingCount} orders</span>
            </div>
            <div className="admin-pay-amount">
              ₹{metrics.pendingAmount.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
              Awaiting buyer settlement authorization
            </span>
          </div>

          {/* Processing */}
          <div className="admin-pay-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="admin-pay-card-top">
              <span className="admin-pay-label">Processing Queue</span>
              <span className="admin-pay-count">{metrics.processingCount} transactions</span>
            </div>
            <div className="admin-pay-amount">
              ₹{metrics.processingAmount.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
              In bank / mandi clearance pipeline
            </span>
          </div>

          {/* Total Payments Count */}
          <div className="admin-pay-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="admin-pay-card-top">
              <span className="admin-pay-label">All Payment Records</span>
              <span className="admin-pay-count">Shared Ledger</span>
            </div>
            <div className="admin-pay-amount" style={{ color: '#0f172a' }}>
              {metrics.totalPayments}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>
              One real payment per order
            </span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="admin-filter-bar">
          {PAYMENT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`admin-filter-tab ${statusFilter === tab.id ? 'active' : ''}`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="admin-loading-box">
            <RefreshCw size={22} className="animate-spin" />
            <span>Loading payment records...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
              <IndianRupee size={24} />
            </div>
            <p className="admin-empty-title">
              {search || statusFilter !== 'ALL' ? 'No payments matched your criteria.' : 'No payments found.'}
            </p>
            <p className="admin-empty-text">
              {search || statusFilter !== 'ALL'
                ? 'Try resetting your search query or selecting a different payment status tab.'
                : 'Payments initiated by buyers for confirmed crop procurements will appear here.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                className="admin-view-all-btn"
                style={{ marginTop: '12px' }}
              >
                Reset Payment Filters
              </button>
            )}
          </div>
        ) : (
          <div className="admin-section-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Order Ref</th>
                    <th>Crop Produce</th>
                    <th>Buyer</th>
                    <th>Farmer</th>
                    <th>Amount (₹)</th>
                    <th>Payment Status</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.id}>
                      <td>
                        <span className="admin-order-num">
                          {pay.paymentNumber || `KF-PAY-${pay.id}`}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#15803d' }}>
                          #{pay.orderNumber || pay.orderId || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#111827' }}>
                          {pay.cropName || pay.orderCropName || 'Agricultural Produce'}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                          {pay.quantity || pay.actualQuantity || pay.orderQuantity || 0} {pay.unit || pay.orderUnit || 'kg'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>
                          {pay.buyerCompany || pay.buyerName || 'Registered Buyer'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>
                          {pay.farmerName || 'Registered Farmer'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.96rem' }}>
                          ₹{Number(pay.amount || pay.procurementAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-pay-badge ${getPaymentStatusBadgeClass(pay.status || pay.paymentStatus)}`}>
                          {pay.status || pay.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.76rem', color: '#4b5563' }}>
                        {pay.paymentMethod || 'Mandi Escrow / DBT'}
                      </td>
                      <td style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                        {formatDate(pay.completedAt || pay.createdAt || pay.date)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openPaymentDetails(pay.id)}
                          className="admin-table-action-btn"
                          title="View payment record details"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slide-over Drawer for Payment Details */}
        {selectedPaymentId && (
          <div className="admin-drawer-overlay" onClick={closeDetails}>
            <div className="admin-drawer-panel" onClick={(e) => e.stopPropagation()}>
              {/* Drawer Header */}
              <div className="admin-drawer-header">
                <div>
                  <span className="admin-drawer-tag">Mandi Settlement Record</span>
                  <h2 className="admin-drawer-name">
                    {paymentDetails?.paymentNumber || `Payment #${selectedPaymentId}`}
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
                {detailsLoading ? (
                  <div className="admin-loading-box">
                    <RefreshCw size={22} className="animate-spin" />
                    <span>Loading payment information...</span>
                  </div>
                ) : (
                  <>
                    {/* Amount & Status Card */}
                    <div className="admin-drawer-summary-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                            Settlement Amount
                          </span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
                            ₹{Number(paymentDetails?.amount || paymentDetails?.procurementAmount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                            Payment Status
                          </span>
                          <div style={{ marginTop: '2px' }}>
                            <span className={`admin-pay-badge ${getPaymentStatusBadgeClass(paymentDetails?.status || paymentDetails?.paymentStatus)}`}>
                              {paymentDetails?.status || paymentDetails?.paymentStatus || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Connected Order */}
                    <div className="admin-drawer-section">
                      <h4 className="admin-drawer-section-title">Associated Order</h4>
                      <div className="admin-drawer-details-grid">
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Order Number</span>
                          <span className="admin-detail-val" style={{ color: '#15803d', fontWeight: 800 }}>
                            #{paymentDetails?.orderNumber || paymentDetails?.orderId || '—'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Crop Produce</span>
                          <span className="admin-detail-val">{paymentDetails?.cropName || paymentDetails?.orderCropName}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Procured Quantity</span>
                          <span className="admin-detail-val">
                            {paymentDetails?.quantity || paymentDetails?.actualQuantity || paymentDetails?.orderQuantity || 0} {paymentDetails?.unit || paymentDetails?.orderUnit || 'kg'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Procurement Centre</span>
                          <span className="admin-detail-val">
                            {paymentDetails?.procurementCentre || 'Designated Mandi Samiti'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Stakeholders */}
                    <div className="admin-drawer-section">
                      <h4 className="admin-drawer-section-title">Transaction Parties</h4>
                      <div className="admin-drawer-details-grid">
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Payer (Buyer)</span>
                          <span className="admin-detail-val">
                            {paymentDetails?.buyerCompany || paymentDetails?.buyerName || 'Registered Buyer'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                            {paymentDetails?.buyerEmail || paymentDetails?.buyerMobile || '—'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Beneficiary (Farmer)</span>
                          <span className="admin-detail-val">{paymentDetails?.farmerName || 'Registered Farmer'}</span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                            {paymentDetails?.farmerMobile || paymentDetails?.farmerLocation || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Payment Method & Reference */}
                    <div className="admin-drawer-section">
                      <h4 className="admin-drawer-section-title">Settlement Details</h4>
                      <div className="admin-drawer-details-grid">
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Payment Gateway / Mode</span>
                          <span className="admin-detail-val">{paymentDetails?.paymentMethod || 'Mandi Escrow / Direct DBT'}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Transaction Reference</span>
                          <span className="admin-detail-val">
                            {paymentDetails?.transactionId || 'Awaiting bank gateway reference'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Completed Timestamp</span>
                          <span className="admin-detail-val">
                            {formatDate(paymentDetails?.completedAt) || 'In settlement process'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Creation Timestamp</span>
                          <span className="admin-detail-val">{formatDate(paymentDetails?.createdAt || paymentDetails?.date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px', fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                      <ShieldCheck size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      <strong>Shared Ledger Integrity:</strong> This exact payment record is shared with Buyer #{paymentDetails?.buyerId} and Farmer #{paymentDetails?.farmerId}. Payment amounts are determined by the farmer&apos;s verified weighment and authorized by the buyer.
                    </div>
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
      </div>
    </AdminLayout>
  );
}
