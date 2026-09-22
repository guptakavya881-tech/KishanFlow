'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SupplierLayout from '@/components/supplier/SupplierLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Edit3,
  ShoppingBag,
  X,
  Loader2,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Truck,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Farm Tools',
  'Irrigation Equipment',
  'Other',
];

const UNITS = ['bag', 'pack', 'kg', 'liter', 'bottle', 'kit', 'unit'];

export default function SupplierDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Add / Edit Product Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Seeds',
    price: '',
    unit: 'bag',
    stock: '',
    lowStockThreshold: '10',
    description: '',
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [modalError, setModalError] = useState('');

  // Quick Stock Update Modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [updatingStock, setUpdatingStock] = useState(false);

  // Status updating state for orders
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deliveryConfirmOrder, setDeliveryConfirmOrder] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/supplier/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error loading supplier dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Seeds',
      price: '',
      unit: 'bag',
      stock: '',
      lowStockThreshold: '10',
      description: '',
    });
    setModalError('');
    setModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      unit: p.unit || 'bag',
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold || 10),
      description: p.description || '',
    });
    setModalError('');
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    setModalError('');

    try {
      const url = editingProduct
        ? `/api/supplier/products/${editingProduct.id}`
        : '/api/supplier/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          unit: productForm.unit,
          stock: Number(productForm.stock),
          lowStockThreshold: Number(productForm.lowStockThreshold),
          description: productForm.description,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setModalOpen(false);
        fetchDashboardData();
      } else {
        setModalError(resData.error || 'Failed to save product.');
      }
    } catch {
      setModalError('Network error. Please try again.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleOpenStockModal = (p) => {
    setSelectedStockProduct(p);
    setNewStockValue(String(p.stock));
    setStockModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!selectedStockProduct) return;

    setUpdatingStock(true);
    try {
      const res = await fetch(`/api/supplier/products/${selectedStockProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockOnly: true,
          stock: Number(newStockValue),
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setStockModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating stock:', err);
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await fetch('/api/supplier/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const resData = await res.json();
      if (resData.success) {
        setDeliveryConfirmOrder(null);
        fetchDashboardData();
      } else {
        alert(resData.error || 'Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Network error occurred.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderOrderPaymentBadge = (paymentStatus) => {
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

  const supplierName = user?.fullName || data?.supplier?.fullName || 'AgriSupply Logistics Co.';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const renderOrderStatusBadge = (status) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s === 'pending') {
      return <span className="supplier-badge status-pending">Pending</span>;
    }
    if (s === 'confirmed') {
      return <span className="supplier-badge status-confirmed">Confirmed</span>;
    }
    if (s === 'shipped') {
      return <span className="supplier-badge status-shipped">Shipped</span>;
    }
    if (s === 'delivered') {
      return <span className="supplier-badge status-delivered">Delivered</span>;
    }
    return <span className="supplier-badge status-cancelled">Cancelled</span>;
  };

  return (
    <SupplierLayout
      title="Supplier Dashboard"
      subtitle="Manage your agricultural products, inventory and farmer orders."
    >
      <div className="supplier-saas-content">
        {/* ======================================================== */}
        {/* 1. WELCOME CARD                                          */}
        {/* ======================================================== */}
        <section className="supplier-welcome-banner">
          <div className="supplier-welcome-flourish">
            <svg width="220" height="220" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M50 95 C50 60 20 50 10 30 C30 30 45 45 50 60 C55 45 70 30 90 30 C80 50 50 60 50 95 Z" fill="currentColor" opacity="0.6" />
              <path d="M50 70 C40 50 25 40 15 20 C35 22 45 35 50 50 C55 35 65 22 85 20 C75 40 60 50 50 70 Z" fill="currentColor" opacity="0.4" />
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <span className="supplier-welcome-pill">
              🌾 Input &amp; Logistics Hub
            </span>
            <h1 className="supplier-welcome-title">
              Welcome back, {supplierName} 👋
            </h1>
            <p className="supplier-welcome-desc">
              Manage your products, inventory and farmer orders in one place.
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. FOUR ATTRACTIVE STATISTICS CARDS                      */}
        {/* ======================================================== */}
        <section className="supplier-stats-grid">
          {/* 1. Total Products */}
          <div className="supplier-stat-card">
            <div className="supplier-stat-top">
              <span className="supplier-stat-label">Total Products</span>
              <div className="supplier-stat-icon-wrap green">
                <Package size={20} />
              </div>
            </div>
            <div className="supplier-stat-val">
              {loading ? '—' : data?.stats?.totalProducts ?? 0}
            </div>
            <div className="supplier-stat-sub">Active input catalog</div>
          </div>

          {/* 2. Products In Stock */}
          <div className="supplier-stat-card">
            <div className="supplier-stat-top">
              <span className="supplier-stat-label">Products In Stock</span>
              <div className="supplier-stat-icon-wrap emerald">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="supplier-stat-val" style={{ color: '#166534' }}>
              {loading ? '—' : data?.stats?.productsInStock ?? 0}
            </div>
            <div className="supplier-stat-sub" style={{ color: '#16a34a' }}>
              Available for farmer dispatch
            </div>
          </div>

          {/* 3. Pending Orders */}
          <div className="supplier-stat-card">
            <div className="supplier-stat-top">
              <span className="supplier-stat-label">Pending Orders</span>
              <div className="supplier-stat-icon-wrap amber">
                <Clock size={20} />
              </div>
            </div>
            <div className="supplier-stat-val" style={{ color: '#b45309' }}>
              {loading ? '—' : data?.stats?.pendingOrders ?? 0}
            </div>
            <div className="supplier-stat-sub" style={{ color: '#d97706' }}>
              Awaiting confirmation/dispatch
            </div>
          </div>

          {/* 4. Completed Orders */}
          <div className="supplier-stat-card">
            <div className="supplier-stat-top">
              <span className="supplier-stat-label">Completed Orders</span>
              <div className="supplier-stat-icon-wrap blue">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="supplier-stat-val" style={{ color: '#1e40af' }}>
              {loading ? '—' : data?.stats?.completedOrders ?? 0}
            </div>
            <div className="supplier-stat-sub" style={{ color: '#3b82f6' }}>
              Delivered successfully
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. PRODUCTS SECTION & LOW STOCK SPLIT                     */}
        {/* ======================================================== */}
        <section className="supplier-dashboard-split">
          {/* Left: Your Products Card */}
          <div className="supplier-card">
            <div className="supplier-card-header">
              <div>
                <h2 className="supplier-card-title">
                  Your Products
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#64748b',
                      marginLeft: '6px',
                    }}
                  >
                    ({data?.products?.length || 0} registered)
                  </span>
                </h2>
                <p className="supplier-card-subtitle">
                  Agricultural inputs, seeds, bio-fertilizers, and farm machinery listed for farmers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="supplier-btn-primary"
              >
                <Plus size={16} />
                <span>+ Add Product</span>
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px', color: '#15803d' }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Loading product inventory...</p>
              </div>
            ) : !data?.products || data.products.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  border: '1.5px dashed #cbd5e1',
                }}
              >
                <Package size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  No products listed yet
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748b', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Publish certified seeds, fertilizers, or farm machinery to start receiving farmer orders.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="supplier-btn-primary"
                >
                  <Plus size={16} />
                  <span>Add First Product</span>
                </button>
              </div>
            ) : (
              <div className="supplier-table-container">
                <table className="supplier-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Available Stock</th>
                      <th>Stock Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p) => {
                      const isOut = Number(p.stock) === 0;
                      const isLow = !isOut && Number(p.stock) <= Number(p.lowStockThreshold || 10);

                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                              {p.name}
                            </div>
                            {p.description && (
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#64748b',
                                  marginTop: '2px',
                                  maxWidth: '280px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {p.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 700,
                                fontSize: '0.72rem',
                              }}
                            >
                              {p.category}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: '#0f172a' }}>
                            {formatCurrency(p.price)}{' '}
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                              /{p.unit || 'bag'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#1e293b' }}>
                            {p.stock} {p.unit || 'units'}
                          </td>
                          <td>
                            {isOut ? (
                              <span className="supplier-badge out-of-stock">Out of Stock</span>
                            ) : isLow ? (
                              <span className="supplier-badge low-stock">Low Stock</span>
                            ) : (
                              <span className="supplier-badge in-stock">In Stock</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(p)}
                              className="supplier-btn-secondary"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: Low Stock Alerts Card */}
          <div className="supplier-card" style={{ height: 'fit-content' }}>
            <div className="supplier-card-header">
              <h2 className="supplier-card-title" style={{ color: '#92400e' }}>
                <AlertTriangle size={18} style={{ color: '#d97706' }} />
                <span>Low Stock Alerts</span>
              </h2>
              {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
                <span className="supplier-badge low-stock">
                  {data.lowStockProducts.length} Attention
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                Auditing warehouse inventory...
              </div>
            ) : !data?.lowStockProducts || data.lowStockProducts.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f0fdf4',
                  borderRadius: '16px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <CheckCircle2 size={30} style={{ color: '#16a34a', margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.86rem', color: '#14532d' }}>
                  All products are sufficiently stocked.
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#15803d', fontWeight: 500 }}>
                  No items currently below minimum replenishment thresholds.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                  These items are low or depleted. Update quantities to prevent fulfillment delays:
                </p>

                {data.lowStockProducts.map((item) => (
                  <div key={item.id} className="supplier-low-stock-item">
                    <div style={{ minWidth: 0 }}>
                      <div className="supplier-low-stock-name">
                        {item.name}
                      </div>
                      <div className="supplier-low-stock-qty">
                        Current: <strong>{item.stock} {item.unit || 'units'}</strong> (Alert at {item.lowStockThreshold})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenStockModal(item)}
                      className="supplier-btn-secondary"
                      style={{
                        backgroundColor: '#d97706',
                        color: '#ffffff',
                        borderColor: '#b45309',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                      }}
                    >
                      Update Stock
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: '12px',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#fafaf9',
                border: '1px solid #f1f5f9',
                fontSize: '0.75rem',
                color: '#64748b',
                lineHeight: 1.4,
              }}
            >
              <strong style={{ color: '#334155', display: 'block', marginBottom: '2px' }}>
                Logistics Insight:
              </strong>
              Maintain at least 15+ units of staple wheat/rice seeds during early seasonal planting cycles.
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. RECENT ORDERS SECTION                                 */}
        {/* ======================================================== */}
        <section className="supplier-card">
          <div className="supplier-card-header">
            <div>
              <h2 className="supplier-card-title">Recent Orders</h2>
              <p className="supplier-card-subtitle">
                Farmer procurement orders placed across regional mandis and direct delivery centers.
              </p>
            </div>

            <Link href="/supplier/orders" className="supplier-btn-secondary">
              <span>View All Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px', color: '#15803d' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Loading recent orders...</p>
            </div>
          ) : !data?.recentOrders || data.recentOrders.length === 0 ? (
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
                    <th>Quantity &amp; Value</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => {
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
                          {renderOrderStatusBadge(o.status)}
                        </td>
                        <td>
                          {renderOrderPaymentBadge(o.paymentStatus)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={updatingOrderId === o.id}
                              onClick={() => handleUpdateOrderStatus(o.id, 'CONFIRMED')}
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
                            >
                              {updatingOrderId === o.id ? <Loader2 size={13} className="animate-spin" /> : 'Confirm Order'}
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
                              disabled={updatingOrderId === o.id}
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
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD OR EDIT PRODUCT                               */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="supplier-modal-backdrop">
          <div className="supplier-modal-card">
            <div className="supplier-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={18} />
                </div>
                <h3 className="supplier-modal-title">
                  {editingProduct ? 'Edit Agricultural Product' : 'Add New Agricultural Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  margin: '16px 24px 0',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div className="supplier-modal-body">
                <div className="supplier-form-group">
                  <label className="supplier-form-label">
                    Product Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Certified Sharbati Wheat Seeds (PBW 550)"
                    className="supplier-form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Category <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="supplier-form-select"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Packaging Unit
                    </label>
                    <select
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="supplier-form-select"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Price (₹) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="850"
                      className="supplier-form-input"
                    />
                  </div>

                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Stock <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      placeholder="50"
                      className="supplier-form-input"
                    />
                  </div>

                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={productForm.lowStockThreshold}
                      onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
                      placeholder="10"
                      className="supplier-form-input"
                    />
                  </div>
                </div>

                <div className="supplier-form-group">
                  <label className="supplier-form-label">
                    Description &amp; Specifications
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Provide seed variety, chemical composition, or warranty details..."
                    className="supplier-form-textarea"
                  />
                </div>
              </div>

              <div className="supplier-modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="supplier-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="supplier-btn-primary"
                >
                  {savingProduct ? <Loader2 size={15} className="animate-spin" /> : null}
                  <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QUICK STOCK UPDATE                                */}
      {/* ======================================================== */}
      {stockModalOpen && selectedStockProduct && (
        <div className="supplier-modal-backdrop">
          <div className="supplier-modal-card" style={{ maxWidth: '420px' }}>
            <div className="supplier-modal-header">
              <h3 className="supplier-modal-title">Update Stock Quantity</h3>
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStock}>
              <div className="supplier-modal-body">
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.84rem', color: '#78350f' }}>
                    {selectedStockProduct.name}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#b45309' }}>
                    Current inventory:{' '}
                    <strong>{selectedStockProduct.stock} {selectedStockProduct.unit}</strong>
                  </p>
                </div>

                <div className="supplier-form-group">
                  <label className="supplier-form-label">
                    New Available Quantity ({selectedStockProduct.unit || 'units'})
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    className="supplier-form-input"
                    style={{ fontSize: '1.1rem', fontWeight: 800 }}
                  />
                </div>
              </div>

              <div className="supplier-modal-footer">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="supplier-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStock}
                  className="supplier-btn-primary"
                >
                  {updatingStock ? <Loader2 size={15} className="animate-spin" /> : null}
                  <span>Save Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  disabled={updatingOrderId === deliveryConfirmOrder.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingOrderId === deliveryConfirmOrder.id}
                  onClick={() => handleUpdateOrderStatus(deliveryConfirmOrder.id, 'DELIVERED')}
                  className="farmer-btn-primary"
                >
                  {updatingOrderId === deliveryConfirmOrder.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>Mark as Delivered</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </SupplierLayout>
    );
  }

