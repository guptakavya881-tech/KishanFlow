'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Package,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingBag,
  Building,
  Calendar,
  Sprout,
  Sparkles,
  Tractor,
  MapPin,
  Clock,
  Check,
  Tag,
  ShieldCheck,
  CreditCard,
  Truck,
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All Orders', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const CATALOG_CATEGORIES = ['ALL', 'SEEDS', 'FERTILIZERS', 'MACHINERY', 'PESTICIDES', 'TOOLS'];

export default function FarmerSupplierOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Ordering modal states
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQty, setOrderQty] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.location || '');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [modalMsg, setModalMsg] = useState({ type: '', text: '' });
  const [toastMsg, setToastMsg] = useState('');

  // Payment modal states
  const [payModalOrder, setPayModalOrder] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Mandi Escrow / Direct DBT (Test)');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Fetch farmer's supplier orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/farmer/supplier-orders?status=${statusFilter}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching farmer supplier orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Fetch available supplier catalog products
  const fetchCatalog = async () => {
    try {
      setCatalogLoading(true);
      const params = new URLSearchParams();
      if (catalogCategory !== 'ALL') params.set('category', catalogCategory);
      if (catalogSearch.trim()) params.set('search', catalogSearch.trim());

      const res = await fetch(`/api/farmer/supplier-products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCatalog(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching supplier catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (orderModalOpen) {
      fetchCatalog();
    }
  }, [orderModalOpen, catalogCategory]);

  const handleOpenOrderModal = () => {
    setSelectedProduct(null);
    setOrderQty(1);
    setDeliveryAddress(user?.location || '');
    setModalMsg({ type: '', text: '' });
    setCatalogCategory('ALL');
    setCatalogSearch('');
    setOrderModalOpen(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setPlacingOrder(true);
      setModalMsg({ type: '', text: '' });

      const res = await fetch('/api/farmer/supplier-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: Number(orderQty),
          deliveryAddress: deliveryAddress.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(`Order #${json.data?.orderNumber} placed successfully!`);
        setOrderModalOpen(false);
        fetchOrders();
        setTimeout(() => setToastMsg(''), 5000);
      } else {
        setModalMsg({ type: 'error', text: json.error || 'Failed to place order.' });
      }
    } catch {
      setModalMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const renderStatusBadge = (status) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s === 'pending') {
      return (
        <span className="farmer-status-badge status-pending">
          <Clock size={12} />
          <span>Pending</span>
        </span>
      );
    }
    if (s === 'confirmed') {
      return (
        <span className="farmer-status-badge status-confirmed">
          <CheckCircle2 size={12} />
          <span>Confirmed</span>
        </span>
      );
    }
    if (s === 'shipped') {
      return (
        <span className="farmer-status-badge status-shipped">
          <Package size={12} />
          <span>Shipped</span>
        </span>
      );
    }
    if (s === 'delivered') {
      return (
        <span className="farmer-status-badge status-delivered">
          <Check size={12} />
          <span>Delivered</span>
        </span>
      );
    }
    return (
      <span className="farmer-status-badge status-cancelled">
        <X size={12} />
        <span>Cancelled</span>
      </span>
    );
  };

  const renderPaymentBadge = (paymentStatus) => {
    const isPaid = String(paymentStatus || '').toUpperCase() === 'PAID';
    if (isPaid) {
      return (
        <span className="farmer-payment-badge payment-paid">
          <CheckCircle2 size={11} />
          <span>Paid</span>
        </span>
      );
    }
    return (
      <span className="farmer-payment-badge payment-unpaid">
        <Clock size={11} />
        <span>Payment Pending</span>
      </span>
    );
  };

  const handleConfirmPayment = async (e) => {
    if (e) e.preventDefault();
    if (!payModalOrder) return;
    try {
      setPaying(true);
      setPayError('');
      const res = await fetch(`/api/farmer/supplier-orders/${payModalOrder.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: selectedPaymentMethod }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg(`Payment of ${formatCurrency(payModalOrder.totalAmount)} for order #${payModalOrder.orderNumber || payModalOrder.id} completed successfully!`);
        setPayModalOrder(null);
        fetchOrders();
        setTimeout(() => setToastMsg(''), 5000);
      } else {
        setPayError(json.error || 'Payment failed. Please try again.');
      }
    } catch {
      setPayError('Network error occurred during payment processing.');
    } finally {
      setPaying(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this pending order?')) return;
    try {
      const res = await fetch('/api/farmer/supplier-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'cancel' }),
      });
      const json = await res.json();
      if (json.success) {
        setToastMsg('Order cancelled and inventory restored.');
        fetchOrders();
        setTimeout(() => setToastMsg(''), 5000);
      } else {
        alert(json.error || 'Failed to cancel order.');
      }
    } catch {
      alert('Failed to cancel order.');
    }
  };

  const getProductCategoryIcon = (category) => {
    const cat = String(category || '').toUpperCase();
    if (cat.includes('SEED')) return <Sprout size={20} />;
    if (cat.includes('FERT')) return <Sparkles size={20} />;
    if (cat.includes('MACHIN') || cat.includes('TOOL')) return <Tractor size={20} />;
    return <Package size={20} />;
  };

  return (
    <FarmerLayout
      title="Supplier Inputs"
      subtitle="Order agricultural inputs directly from verified suppliers."
    >
      <div className="farmer-supplier-page-wrapper">
        {/* Toast Notification */}
        {toastMsg && (
          <div
            style={{
              padding: '14px 20px',
              borderRadius: '14px',
              backgroundColor: '#dcfce7',
              border: '1.5px solid #bbf7d0',
              color: '#15803d',
              fontSize: '0.88rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(21, 128, 61, 0.12)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <CheckCircle2 size={20} style={{ color: '#15803d', flexShrink: 0 }} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 4. Page Header & Primary Action Button */}
        <div className="farmer-supplier-hero">
          <div className="farmer-supplier-hero-title-wrap">
            <h1 className="farmer-supplier-hero-title">Supplier Inputs</h1>
            <p className="farmer-supplier-hero-subtitle">
              Order seeds, fertilizers, farm tools and other agricultural inputs from verified suppliers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenOrderModal}
            className="farmer-btn-primary"
            id="order-farm-inputs-btn"
          >
            <Plus size={18} />
            <span>+ Order Farm Inputs</span>
          </button>
        </div>

        {/* 5. Modern Segmented Tabs */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="farmer-segmented-tabs">
            <Link
              href="/farmer/orders"
              className="farmer-tab-btn"
            >
              <Package size={15} />
              <span>Crop Purchase Orders</span>
            </Link>
            <button
              type="button"
              className="farmer-tab-btn active"
            >
              <Sprout size={15} />
              <span>My Supplier Orders</span>
            </button>
          </div>
        </div>

        {/* 6. Main Card: My Supplier Orders */}
        <div className="farmer-supplier-card">
          <div className="farmer-supplier-card-header">
            <div>
              <h2 className="farmer-supplier-card-title">My Supplier Orders</h2>
              <p className="farmer-supplier-card-subtitle">
                Track seeds, fertilizers, farm tools and other inputs ordered from verified suppliers.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenOrderModal}
              className="farmer-btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              <Plus size={16} />
              <span>+ Order Farm Inputs</span>
            </button>
          </div>

          {/* 7. Status Filter Pills */}
          <div className="farmer-filter-pills">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`farmer-filter-pill ${statusFilter === f.value ? 'active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 8. Order Cards / Loading / 9. Empty State */}
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>
                Loading your supplier orders...
              </p>
            </div>
          ) : orders.length === 0 ? (
            /* 9. Polished Empty State */
            <div className="farmer-empty-state">
              <div className="farmer-empty-icon-circle">
                <ShoppingBag size={32} />
              </div>
              <h3 className="farmer-empty-title">No supplier orders yet</h3>
              <p className="farmer-empty-desc">
                Order seeds, fertilizers, farm tools and other agricultural inputs from verified suppliers.
              </p>
              <button
                type="button"
                onClick={handleOpenOrderModal}
                className="farmer-btn-primary"
                style={{ marginTop: '4px' }}
              >
                <Plus size={16} />
                <span>+ Order Farm Inputs</span>
              </button>
            </div>
          ) : (
            /* 8. Order Cards Responsive Grid */
            <div className="farmer-order-grid">
              {orders.map((o) => (
                <div key={o.id} className="farmer-order-card">
                  <div>
                    {/* Top Row: Order ID, Payment Status & Order Status Badge */}
                    <div className="farmer-order-card-top">
                      <span className="farmer-order-id-chip">
                        #{o.orderNumber || o.id}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderPaymentBadge(o.paymentStatus)}
                        {renderStatusBadge(o.status)}
                      </div>
                    </div>

                    {/* Product & Supplier Details */}
                    <div className="farmer-order-product-row" style={{ marginTop: '14px' }}>
                      <div className="farmer-order-icon-box">
                        {getProductCategoryIcon(o.productCategory)}
                      </div>
                      <div className="farmer-order-product-details">
                        <h4 className="farmer-order-product-name">
                          {o.productName || 'Agricultural Input'}
                        </h4>
                        <div className="farmer-order-supplier-meta">
                          <Building size={13} style={{ color: '#94a3b8' }} />
                          <span>{o.supplierName || `Supplier #${o.supplierId}`}</span>
                          {o.supplierLocation && (
                            <span style={{ color: '#94a3b8' }}>• {o.supplierLocation}</span>
                          )}
                        </div>
                        {o.productCategory && (
                          <span className="farmer-order-category-tag">
                            {o.productCategory}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Box: Quantity, Price, Total Amount */}
                  <div className="farmer-order-metrics-box">
                    <div className="farmer-order-metric">
                      <span className="farmer-order-metric-label">Quantity</span>
                      <span className="farmer-order-metric-value">
                        {o.quantity} {o.productUnit || 'units'}
                      </span>
                    </div>

                    <div className="farmer-order-metric" style={{ textAlign: 'center' }}>
                      <span className="farmer-order-metric-label">Unit Price</span>
                      <span className="farmer-order-metric-value">
                        {formatCurrency(o.unitPrice)}/{o.productUnit || 'unit'}
                      </span>
                    </div>

                    <div className="farmer-order-metric" style={{ textAlign: 'right' }}>
                      <span className="farmer-order-metric-label">Total Amount</span>
                      <span className="farmer-order-metric-total">
                        {formatCurrency(o.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Order Date & Location */}
                  <div className="farmer-order-card-bottom">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} style={{ color: '#94a3b8' }} />
                      <span>
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {o.deliveryAddress && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          maxWidth: '180px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={o.deliveryAddress}
                      >
                        <MapPin size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.deliveryAddress}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action / Lifecycle Row */}
                  {String(o.status || '').toUpperCase() === 'CONFIRMED' && String(o.paymentStatus || '').toUpperCase() !== 'PAID' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <AlertCircle size={14} /> Order confirmed. Please complete payment.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPayModalOrder(o);
                          setSelectedPaymentMethod('Mandi Escrow / Direct DBT (Test)');
                          setPayError('');
                        }}
                        className="farmer-pay-now-btn"
                        id={`pay-now-btn-${o.id}`}
                      >
                        <CreditCard size={14} />
                        <span>Pay Now ({formatCurrency(o.totalAmount)})</span>
                      </button>
                    </div>
                  )}

                  {String(o.status || '').toUpperCase() === 'DELIVERED' && String(o.paymentStatus || '').toUpperCase() === 'PAID' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <div className="farmer-delivered-banner">
                        <CheckCircle2 size={15} />
                        <span>Delivered successfully</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                        {o.deliveredAt ? `Delivered on ${new Date(o.deliveredAt).toLocaleDateString('en-IN')}` : 'Fulfillment Complete'}
                      </span>
                    </div>
                  )}

                  {String(o.status || '').toUpperCase() === 'CONFIRMED' && String(o.paymentStatus || '').toUpperCase() === 'PAID' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={14} /> Payment received. Awaiting dispatch & delivery.
                      </span>
                      <span className="farmer-awaiting-badge">
                        <Package size={13} /> Ready for Delivery
                      </span>
                    </div>
                  )}

                  {String(o.status || '').toUpperCase() === 'PENDING' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <span className="farmer-awaiting-badge">
                        <Clock size={13} /> Awaiting supplier confirmation
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(o.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 10. Order Farm Inputs Modal UI */}
        {orderModalOpen && (
          <div className="farmer-modal-backdrop">
            <div className="farmer-modal-card">
              {/* Modal Header */}
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
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="farmer-modal-title">Order Farm Inputs</h3>
                    <p className="farmer-modal-subtitle">
                      Order seeds, fertilizers &amp; farm tools directly from verified suppliers.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="farmer-modal-close-btn"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Feedback Message */}
              {modalMsg.text && (
                <div
                  style={{
                    margin: '16px 24px 0',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: modalMsg.type === 'error' ? '#fee2e2' : '#dcfce7',
                    border: '1.5px solid',
                    borderColor: modalMsg.type === 'error' ? '#fecaca' : '#bbf7d0',
                    color: modalMsg.type === 'error' ? '#b91c1c' : '#15803d',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {modalMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>{modalMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePlaceOrder}>
                <div className="farmer-modal-body">
                  {/* Category Filter Chips */}
                  <div className="farmer-form-group">
                    <label className="farmer-form-label">Product Category</label>
                    <div className="farmer-cat-chips">
                      {CATALOG_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCatalogCategory(cat)}
                          className={`farmer-cat-chip ${catalogCategory === cat ? 'active' : ''}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Product List */}
                  <div className="farmer-form-group">
                    <label className="farmer-form-label">
                      Select Input Product <span style={{ color: '#dc2626' }}>*</span>
                    </label>

                    {catalogLoading ? (
                      <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                        <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#15803d' }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Loading verified supplier catalog...</span>
                      </div>
                    ) : catalog.length === 0 ? (
                      <div
                        style={{
                          padding: '24px 16px',
                          background: '#f8fafc',
                          borderRadius: '14px',
                          textAlign: 'center',
                          fontSize: '0.82rem',
                          color: '#64748b',
                          border: '1.5px dashed #cbd5e1',
                        }}
                      >
                        No supplier products currently available in this category.
                      </div>
                    ) : (
                      <div className="farmer-modal-product-list">
                        {catalog.map((p) => {
                          const isSelected = selectedProduct?.id === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedProduct(p);
                                if (orderQty > p.stock) setOrderQty(Math.max(1, p.stock));
                              }}
                              className={`farmer-modal-product-item ${isSelected ? 'selected' : ''}`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    backgroundColor: isSelected ? '#dcfce7' : '#f1f5f9',
                                    color: isSelected ? '#15803d' : '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {getProductCategoryIcon(p.category)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      fontSize: '0.88rem',
                                      color: isSelected ? '#15803d' : '#0f172a',
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {p.name}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                                    Supplier: <strong>{p.supplierName}</strong>
                                    {p.category && ` • ${p.category}`}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                                  {formatCurrency(p.price)}
                                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                    /{p.unit}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, marginTop: '2px' }}>
                                  {p.stock} in stock
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Product Details & Ordering Fields */}
                  {selectedProduct && (
                    <>
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '14px',
                          backgroundColor: '#f0fdf4',
                          border: '1.5px solid #bbf7d0',
                          fontSize: '0.82rem',
                          color: '#166534',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                          <ShieldCheck size={16} style={{ color: '#15803d' }} />
                          <span>
                            Selected: {selectedProduct.name} ({selectedProduct.category || 'General'})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#15803d' }}>
                          Unit Price: <strong>{formatCurrency(selectedProduct.price)}</strong> per {selectedProduct.unit} • Supplied by <strong>{selectedProduct.supplierName}</strong>
                        </div>
                        {selectedProduct.description && (
                          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px', fontStyle: 'italic' }}>
                            {selectedProduct.description}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="farmer-form-group">
                          <label className="farmer-form-label">
                            Quantity ({selectedProduct.unit || 'units'}) <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={selectedProduct.stock}
                            value={orderQty}
                            onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="farmer-form-input"
                            style={{ fontWeight: 800, fontSize: '1rem' }}
                          />
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Available in stock: {selectedProduct.stock} {selectedProduct.unit}
                          </span>
                        </div>

                        <div className="farmer-form-group">
                          <label className="farmer-form-label">Total Payable</label>
                          <div
                            style={{
                              height: '42px',
                              padding: '0 14px',
                              borderRadius: '12px',
                              backgroundColor: '#f8fafc',
                              border: '1.5px solid #cbd5e1',
                              fontWeight: 900,
                              fontSize: '1.15rem',
                              color: '#15803d',
                              display: 'flex',
                              alignItems: 'center',
                              boxSizing: 'border-box',
                            }}
                          >
                            {formatCurrency(selectedProduct.price * orderQty)}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {orderQty} × {formatCurrency(selectedProduct.price)}
                          </span>
                        </div>
                      </div>

                      <div className="farmer-form-group">
                        <label className="farmer-form-label">
                          Delivery Address / Mandi Hub
                        </label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Village, Tehsil, or Mandi delivery point..."
                          className="farmer-form-input"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="farmer-modal-footer">
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
                    className="farmer-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={placingOrder || !selectedProduct}
                    className="farmer-btn-primary"
                  >
                    {placingOrder ? <Loader2 size={16} className="animate-spin" /> : null}
                    <span>Confirm &amp; Place Order</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Payment Modal */}
        {payModalOrder && (
          <div className="farmer-modal-backdrop" style={{ zIndex: 1100 }}>
            <div className="farmer-modal-card" style={{ maxWidth: '520px' }}>
              {/* Modal Header */}
              <div className="farmer-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 className="farmer-modal-title">Complete Order Payment</h3>
                    <p className="farmer-modal-subtitle">
                      Order #{payModalOrder.orderNumber || payModalOrder.id} • Verified Escrow
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayModalOrder(null)}
                  className="farmer-modal-close-btn"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Payment Error */}
              {payError && (
                <div
                  style={{
                    margin: '16px 24px 0',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#fee2e2',
                    border: '1.5px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{payError}</span>
                </div>
              )}

              {/* Modal Body */}
              <div className="farmer-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Order Summary Box */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Product</span>
                    <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>
                      {payModalOrder.productName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Supplier</span>
                    <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>
                      {payModalOrder.supplierName || `Supplier #${payModalOrder.supplierId}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Quantity</span>
                    <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700 }}>
                      {payModalOrder.quantity} {payModalOrder.productUnit || 'units'} @ {formatCurrency(payModalOrder.unitPrice)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px dashed #cbd5e1',
                      marginTop: '4px',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>Total Payable</span>
                    <span style={{ fontSize: '1.05rem', color: '#15803d', fontWeight: 800 }}>
                      {formatCurrency(payModalOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Simulated Payment Notice */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldCheck size={16} style={{ flexShrink: 0, color: '#2563eb' }} />
                  <span>
                    <strong>Development / Mandi Escrow Mode:</strong> Simulated instant settlement. Funds will be verified and order flagged ready for supplier delivery.
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      marginBottom: '8px',
                    }}
                  >
                    Select Payment Method
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { id: 'Mandi Escrow / Direct DBT (Test)', label: 'Mandi Escrow / Direct DBT (Test Settlement)' },
                      { id: 'UPI / Bharat QR (Simulated Instant)', label: 'UPI / Bharat QR (Instant Settlement)' },
                      { id: 'Kishan Credit Card (KCC / Test)', label: 'Kishan Credit Card (KCC)' },
                      { id: 'Net Banking / NEFT', label: 'Net Banking / RTGS / NEFT' },
                    ].map((m) => (
                      <label
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid',
                          borderColor: selectedPaymentMethod === m.id ? '#15803d' : '#e2e8f0',
                          backgroundColor: selectedPaymentMethod === m.id ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: selectedPaymentMethod === m.id ? 800 : 600,
                          color: selectedPaymentMethod === m.id ? '#15803d' : '#334155',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={m.id}
                          checked={selectedPaymentMethod === m.id}
                          onChange={() => setSelectedPaymentMethod(m.id)}
                          style={{ accentColor: '#15803d' }}
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="farmer-modal-footer">
                <button
                  type="button"
                  onClick={() => setPayModalOrder(null)}
                  className="farmer-btn-secondary"
                  disabled={paying}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={paying}
                  className="farmer-btn-primary"
                  id="confirm-pay-btn"
                >
                  {paying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Confirm &amp; Pay {formatCurrency(payModalOrder.totalAmount)}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
}

