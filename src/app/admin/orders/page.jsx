'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Warehouse,
  MapPin,
  Calendar,
  X,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Building2,
  Users,
  IndianRupee,
  Filter,
  Check,
  FileText,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'ORDER_REQUESTED', label: 'Requested' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'PROCUREMENT_SCHEDULED', label: 'Scheduled' },
  { id: 'READY_FOR_PROCUREMENT', label: 'Ready' },
  { id: 'PROCUREMENT_COMPLETED', label: 'Procured' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Procurement completion confirmation modal state
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data?.orders) {
        setOrders(json.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedOrderId) {
        closeDetails();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrderId]);

  const openOrderDetails = async (id) => {
    setSelectedOrderId(id);
    setOrderDetails(null);
    setDetailsError(null);
    try {
      setDetailsLoading(true);
      const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrderDetails(json.data);
      } else {
        setDetailsError(json.error || 'Order not found.');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setDetailsError('Network or server error while retrieving order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrderId(null);
    setOrderDetails(null);
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
        if (selectedOrderId) {
          openOrderDetails(selectedOrderId);
        }
        loadOrders();
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

  const getOrderStatusBadgeClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('REQUESTED') || s.includes('PENDING')) return 'requested';
    if (s.includes('CONFIRM') || s.includes('SCHEDULE')) return 'confirmed';
    if (s.includes('COMPLET') || s.includes('DELIVER')) return 'completed';
    if (s.includes('CANCEL')) return 'cancelled';
    return 'confirmed';
  };

  const getPaymentStatusBadgeClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('PAID') || s.includes('RECEIVE') || s.includes('SUCCESS')) return 'paid';
    if (s.includes('FAIL')) return 'failed';
    return 'pending';
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
              <h1 className="admin-page-title">Procurement Orders</h1>
              <span className="admin-count-pill">{orders.length} Active Orders</span>
            </div>
            <p className="admin-page-subtitle">
              Unified buyer-farmer purchase orders and APMC mandi weighment fulfillment
            </p>
          </div>

          {/* Search bar */}
          <div className="admin-search-wrapper">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, crop, buyer, farmer..."
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

        {/* Status Filter Tabs */}
        <div className="admin-filter-bar">
          {STATUS_TABS.map((tab) => (
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

        {/* Orders Table */}
        {loading ? (
          <div className="admin-loading-box">
            <RefreshCw size={22} className="animate-spin" />
            <span>Loading procurement orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Package size={24} />
            </div>
            <p className="admin-empty-title">
              {search || statusFilter !== 'ALL' ? 'No orders matched your criteria.' : 'No orders found.'}
            </p>
            <p className="admin-empty-text">
              {search || statusFilter !== 'ALL'
                ? 'Try clearing the search term or switching status filter tabs.'
                : 'Purchase orders created by registered buyers will appear here in real-time.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                className="admin-view-all-btn"
                style={{ marginTop: '12px' }}
              >
                Reset Order Filters
              </button>
            )}
          </div>
        ) : (
          <div className="admin-section-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Crop Produce</th>
                    <th>Quantity</th>
                    <th>Buyer</th>
                    <th>Farmer</th>
                    <th>Procurement Centre</th>
                    <th>Order Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isProcCompleted = order.status === 'PROCUREMENT_COMPLETED';
                    const eligible = isEligibleForProcurement(order.status);
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="admin-order-num">#{order.orderNumber}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#111827' }}>{order.cropName}</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {order.quantity} {order.unit || 'kg'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1f2937' }}>
                            {order.buyerCompany || order.buyerName || 'Registered Buyer'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1f2937' }}>
                            {order.farmerName || 'Registered Farmer'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                            {order.procurementCentre || 'Designated Mandi'}
                          </div>
                        </td>
                        <td>
                          <span className={`admin-order-badge ${getOrderStatusBadgeClass(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-pay-badge ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openOrderDetails(order.id)}
                              className="admin-table-action-btn"
                              title="Inspect full details"
                            >
                              Details
                            </button>
                            {eligible && (
                              <button
                                type="button"
                                onClick={() => setConfirmingOrder(order)}
                                className="admin-table-action-btn complete-btn"
                                title="Mark Procurement Complete"
                              >
                                ✓ Procure
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slide-over Drawer for Order Details */}
        {selectedOrderId && (
          <div className="admin-drawer-overlay" onClick={closeDetails}>
            <div className="admin-drawer-panel" onClick={(e) => e.stopPropagation()}>
              {/* Drawer Header */}
              <div className="admin-drawer-header">
                <div>
                  <span className="admin-drawer-tag">Procurement Order</span>
                  <h2 className="admin-drawer-name">
                    Order #{orderDetails?.orderNumber || selectedOrderId}
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
                    <p className="admin-empty-text">The requested procurement order record could not be found or loaded.</p>
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
                    <span>Loading order information...</span>
                  </div>
                ) : (
                  <>
                    {/* Status Highlights */}
                    <div className="admin-drawer-summary-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                            Order Status
                          </span>
                          <div style={{ marginTop: '2px' }}>
                            <span className={`admin-order-badge ${getOrderStatusBadgeClass(orderDetails?.status)}`}>
                              {(orderDetails?.status || 'Not available').replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>
                            Payment Status
                          </span>
                          <div style={{ marginTop: '2px' }}>
                            <span className={`admin-pay-badge ${getPaymentStatusBadgeClass(orderDetails?.paymentStatus)}`}>
                              {orderDetails?.paymentStatus || 'Not available'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Procurement & Payment Timestamps Strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', paddingTop: '10px', marginTop: '10px', borderTop: '1px solid #bbf7d0', fontSize: '0.76rem' }}>
                        <div>
                          <span style={{ color: '#6b7280', display: 'block', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Procurement Date</span>
                          <span style={{ fontWeight: 800, color: '#111827' }}>{formatDate(orderDetails?.procurementDate) || 'Not available'}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#6b7280', display: 'block', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Payment Date</span>
                          <span style={{ fontWeight: 800, color: '#15803d' }}>{formatDate(orderDetails?.paymentDate || orderDetails?.paidAt) || 'Not available'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Eligible Procurement Complete Banner */}
                    {isEligibleForProcurement(orderDetails?.status) && (
                      <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 800, fontSize: '0.86rem' }}>
                          <ShieldCheck size={18} />
                          <span>Administrative Mandi Handover Authority</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                          Produce is verified at the APMC yard. Mark procurement as complete to record official receipt.
                        </p>
                        <button
                          type="button"
                          onClick={() => setConfirmingOrder(orderDetails)}
                          className="admin-proc-complete-btn"
                          style={{ marginTop: '4px' }}
                        >
                          <CheckCircle2 size={15} />
                          <span>Mark Procurement Complete</span>
                        </button>
                      </div>
                    )}

                    {/* Section 1: Produce & Quantity */}
                    <div className="admin-drawer-section">
                      <h4 className="admin-drawer-section-title">Produce Information</h4>
                      <div className="admin-drawer-details-grid">
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Order ID</span>
                          <span className="admin-detail-val" style={{ color: '#15803d', fontWeight: 800 }}>
                            #{orderDetails?.orderNumber || orderDetails?.id || 'Not available'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Crop Name</span>
                          <span className="admin-detail-val">{orderDetails?.cropName || 'Not available'}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Quantity</span>
                          <span className="admin-detail-val">
                            {orderDetails?.quantity ?? orderDetails?.actualQuantity ?? 'Not available'} {orderDetails?.unit || 'kg'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Order Date</span>
                          <span className="admin-detail-val">{formatDate(orderDetails?.createdAt) || 'Not available'}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Agreed Unit Price</span>
                          <span className="admin-detail-val">
                            {orderDetails?.agreedPrice ? `₹${orderDetails.agreedPrice}/${orderDetails.unit || 'kg'}` : 'Not available'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Total Payable</span>
                          <span className="admin-detail-val" style={{ color: '#15803d', fontWeight: 800 }}>
                            {orderDetails?.totalAmount ? `₹${Number(orderDetails.totalAmount).toLocaleString('en-IN')}` : 'Not available'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Buyer & Farmer Stakeholders */}
                    <div className="admin-drawer-section">
                      <h4 className="admin-drawer-section-title">Stakeholder Entities</h4>
                      <div className="admin-drawer-details-grid">
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Buyer Entity</span>
                          <span className="admin-detail-val">
                            {orderDetails?.buyerCompany || orderDetails?.buyerName || 'Not available'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                            {orderDetails?.buyerMobile || orderDetails?.buyerEmail || '—'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Farmer Entity</span>
                          <span className="admin-detail-val">{orderDetails?.farmerName || 'Not available'}</span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                            {orderDetails?.farmerMobile || orderDetails?.farmerLocation || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Mandi Samiti & Centre Details */}
                    <div className="admin-drawer-section">
                      <h4 className="admin-drawer-section-title">Procurement Centre Assignment</h4>
                      <div className="admin-drawer-details-grid">
                        <div className="admin-detail-item" style={{ gridColumn: 'span 2' }}>
                          <span className="admin-detail-label">Designated APMC Centre</span>
                          <span className="admin-detail-val">{orderDetails?.procurementCentre || 'Not available'}</span>
                          {orderDetails?.centreAddress && (
                            <span style={{ fontSize: '0.74rem', color: '#6b7280' }}>{orderDetails.centreAddress}</span>
                          )}
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Arrival Token</span>
                          <span className="admin-detail-val" style={{ color: '#d97706' }}>
                            {orderDetails?.bookingToken || 'Not available'}
                          </span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Expected Date</span>
                          <span className="admin-detail-val">{orderDetails?.expectedDate || 'Not available'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Audit & Status History */}
                    <div className="admin-drawer-section">
                      <h4 className="admin-drawer-section-title">Status Audit Trail</h4>
                      {(!orderDetails?.statusHistory || orderDetails.statusHistory.length === 0) ? (
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Not available</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {orderDetails.statusHistory.map((h, i) => (
                            <div
                              key={i}
                              style={{
                                backgroundColor: '#fafaf9',
                                border: '1px solid #f3f4f6',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '0.78rem',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#15803d' }}>{h.status || 'Update'}</span>
                                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{formatDate(h.timestamp)}</span>
                              </div>
                              {h.note && (
                                <p style={{ margin: '4px 0 0', color: '#4b5563', fontSize: '0.74rem' }}>{h.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                      ✓ Produce weighment, moisture verification, and handover will be confirmed.
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
