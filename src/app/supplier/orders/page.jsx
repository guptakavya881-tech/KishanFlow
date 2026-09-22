'use client';

import React, { useState, useEffect } from 'react';
import SupplierLayout from '@/components/supplier/SupplierLayout';
import {
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  X,
} from 'lucide-react';

const STATUSES = ['ALL', 'Pending', 'Confirmed', 'Delivered', 'Cancelled'];

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/supplier/orders?status=${statusFilter}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setActionError('');
      const res = await fetch('/api/supplier/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Order #${data.data?.orderNumber || orderId} status updated to ${newStatus}.`);
        setTimeout(() => setActionSuccess(''), 4000);
        setDeliveryConfirmOrder(null);
        fetchOrders();
      } else {
        setActionError(data.error || 'Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setActionError('Network error occurred.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getBadge = (status) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s === 'pending') return <span className="supplier-badge status-pending">Pending</span>;
    if (s === 'confirmed') return <span className="supplier-badge status-confirmed">Confirmed</span>;
    if (s === 'shipped') return <span className="supplier-badge status-shipped">Shipped</span>;
    if (s === 'delivered') return <span className="supplier-badge status-delivered">Delivered</span>;
    return <span className="supplier-badge status-cancelled">Cancelled</span>;
  };

  const getPaymentBadge = (paymentStatus) => {
    const isPaid = String(paymentStatus || '').toUpperCase() === 'PAID';
    if (isPaid) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '9999px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            border: '1px solid #bbf7d0',
            fontSize: '0.72rem',
            fontWeight: 800,
          }}
        >
          <CheckCircle2 size={11} />
          <span>Paid</span>
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '9999px',
          backgroundColor: '#fef3c7',
          color: '#b45309',
          border: '1px solid #fde68a',
          fontSize: '0.72rem',
          fontWeight: 800,
        }}
      >
        <Clock size={11} />
        <span>Payment Pending</span>
      </span>
    );
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <SupplierLayout
      title="Farmer Orders"
      subtitle="Fulfill input dispatches and track farm orders across regional mandis."
    >
      <div className="supplier-saas-content">
        {/* Alerts / Feedback */}
        {actionSuccess && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: '#dcfce7',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        <div className="supplier-card">
          <div className="supplier-card-header">
            <div>
              <h2 className="supplier-card-title">Farmer Input Orders</h2>
              <p className="supplier-card-subtitle">
                Review, confirm, dispatch, and complete delivery for orders placed by registered farmers.
              </p>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid',
                  borderColor: statusFilter === st ? '#15803d' : '#e2e8f0',
                  backgroundColor: statusFilter === st ? '#15803d' : '#ffffff',
                  color: statusFilter === st ? '#ffffff' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? 'All Orders' : st}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px', color: '#15803d' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1',
              }}
            >
              <ShoppingBag size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                No supplier orders yet
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                When farmers place orders for your products, they will appear here.
              </p>
            </div>
          ) : (
            <div className="supplier-table-container">
              <table className="supplier-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Farmer</th>
                    <th>Product</th>
                    <th>Volume &amp; Value</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const status = String(o.status || '').toUpperCase();
                    const paymentStatus = String(o.paymentStatus || '').toUpperCase();

                    return (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#15803d', fontSize: '0.85rem' }}>
                          {o.orderNumber}
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                            {o.farmerName || `Farmer #${o.farmerId}`}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
                            {o.farmerLocation || o.deliveryAddress || 'Registered Center'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: '#334155' }}>
                          {o.productName}
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>
                            {formatCurrency(o.totalAmount)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {o.quantity} {o.productUnit || 'units'}
                          </div>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          {getBadge(o.status)}
                        </td>
                        <td>
                          {getPaymentBadge(o.paymentStatus)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={updatingId === o.id}
                              onClick={() => handleUpdateStatus(o.id, 'CONFIRMED')}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#15803d',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)',
                                transition: 'all 0.15s ease',
                              }}
                              id={`confirm-order-btn-${o.id}`}
                            >
                              {updatingId === o.id ? <Loader2 size={13} className="animate-spin" /> : 'Confirm Order'}
                            </button>
                          )}

                          {status === 'CONFIRMED' && paymentStatus !== 'PAID' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                backgroundColor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Clock size={12} />
                              <span>Waiting for Farmer Payment</span>
                            </span>
                          )}

                          {status === 'CONFIRMED' && paymentStatus === 'PAID' && (
                            <button
                              type="button"
                              disabled={updatingId === o.id}
                              onClick={() => setDeliveryConfirmOrder(o)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: '#15803d',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)',
                                transition: 'all 0.15s ease',
                              }}
                              id={`deliver-order-btn-${o.id}`}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <Truck size={13} />
                                <span>Mark as Delivered</span>
                              </span>
                            </button>
                          )}

                          {status === 'DELIVERED' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: '#15803d',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                              }}
                            >
                              <CheckCircle2 size={14} />
                              <span>Delivered</span>
                            </span>
                          )}

                          {status === 'CANCELLED' && (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                              Cancelled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mark as Delivered Confirmation Modal */}
        {deliveryConfirmOrder && (
          <div className="farmer-modal-backdrop" style={{ zIndex: 1100 }}>
            <div className="farmer-modal-card" style={{ maxWidth: '480px' }}>
              <div className="farmer-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="farmer-modal-title">Mark Order as Delivered?</h3>
                    <p className="farmer-modal-subtitle">
                      Order #{deliveryConfirmOrder.orderNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeliveryConfirmOrder(null)}
                  className="farmer-modal-close-btn"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="farmer-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                  Are you sure this agricultural input order has been delivered to the farmer?
                </p>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Farmer:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{deliveryConfirmOrder.farmerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Product:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{deliveryConfirmOrder.productName} ({deliveryConfirmOrder.quantity} units)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Payment Status:</span>
                    <span style={{ fontWeight: 800, color: '#15803d' }}>Verified Paid ({formatCurrency(deliveryConfirmOrder.totalAmount)})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Destination:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{deliveryConfirmOrder.deliveryAddress || 'Direct Mandi Center'}</span>
                  </div>
                </div>
              </div>

              <div className="farmer-modal-footer">
                <button
                  type="button"
                  onClick={() => setDeliveryConfirmOrder(null)}
                  className="farmer-btn-secondary"
                  disabled={updatingId === deliveryConfirmOrder.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingId === deliveryConfirmOrder.id}
                  onClick={() => handleUpdateStatus(deliveryConfirmOrder.id, 'DELIVERED')}
                  className="farmer-btn-primary"
                  id="confirm-deliver-modal-btn"
                >
                  {updatingId === deliveryConfirmOrder.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Mark as Delivered</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupplierLayout>
  );
}
