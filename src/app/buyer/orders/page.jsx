'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import OrderSummaryCards from '@/components/buyer/orders/OrderSummaryCards';
import BuyerOrderCard from '@/components/buyer/orders/BuyerOrderCard';
import BuyerOrderDetailModal from '@/components/buyer/orders/BuyerOrderDetailModal';
import {
  Package,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Sprout,
  Filter,
} from 'lucide-react';

const FILTER_TABS = [
  { id: 'All', label: 'All Orders' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Confirmed', label: 'Confirmed' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled' },
];

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedStatus !== 'All') params.set('status', selectedStatus);

      const res = await fetch(`/api/buyer/orders?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setOrders(json.data.orders || []);
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
      } else {
        setError(json.error || 'Failed to load procurement orders.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Network error while connecting to order service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this procurement request?')) return;
    try {
      const res = await fetch(`/api/buyer/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedOrderDetail(null);
        fetchOrders();
      } else {
        alert(json.error || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Network error while cancelling order.');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
  };

  const hasActiveFilters = searchTerm.trim() !== '' || selectedStatus !== 'All';

  return (
    <BuyerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Header Banner */}
        <div className="buyer-orders-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
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
                <Package size={22} className="stroke-[2.5]" />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                My Orders
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#4b5563', fontWeight: 500 }}>
              View and manage your produce orders and procurement requests.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={fetchOrders}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #e5e7eb',
                color: '#374151',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              href="/buyer/find-produce"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '12px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
              }}
            >
              <Sprout size={16} />
              <span>Find Produce</span>
            </Link>
          </div>
        </div>

        {/* 2. Order Summary Cards (100% Calculated from Real Orders) */}
        <OrderSummaryCards metrics={metrics} />

        {/* 3. Search & Status Filter Bar */}
        <div className="buyer-orders-filter-bar">
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                id="buyer-orders-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order ID or crop name..."
                style={{
                  width: '100%',
                  padding: '11px 16px 11px 42px',
                  borderRadius: '12px',
                  border: '1.5px solid #e5e7eb',
                  backgroundColor: '#fafaf7',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: '#1f2937',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280', letterSpacing: '0.04em', marginRight: '4px' }}>
              Status:
            </span>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`buyer-order-filter-pill ${selectedStatus === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Orders List or Authentic Empty State */}
        {loading && orders.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
            <p style={{ fontWeight: 600 }}>Loading your procurement orders...</p>
          </div>
        ) : error ? (
          <div className="buyer-empty-box">
            <div className="buyer-empty-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#991b1b', margin: 0 }}>
              Unable to load orders
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, maxWidth: '400px' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchOrders}
              style={{
                marginTop: '8px',
                padding: '8px 18px',
                borderRadius: '10px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="buyer-empty-box">
            <div className="buyer-empty-icon-wrap" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
              <Package size={30} />
            </div>

            {hasActiveFilters ? (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  No matching orders found
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0, maxWidth: '420px', lineHeight: 1.5 }}>
                  No order records matched your search &quot;{searchTerm}&quot; or status &quot;{selectedStatus}&quot;.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    marginTop: '10px',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #bbf7d0',
                    color: '#15803d',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  No orders yet 📦
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
                  Your produce orders will appear here once you place your first order.
                </p>
                <Link
                  href="/buyer/find-produce"
                  style={{
                    marginTop: '12px',
                    padding: '10px 22px',
                    borderRadius: '12px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  <Sprout size={16} />
                  <span>Find Produce</span>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="buyer-orders-list-grid">
            {orders.map((order) => (
              <BuyerOrderCard
                key={order.id}
                order={order}
                onViewDetails={(selected) => setSelectedOrderDetail(selected)}
              />
            ))}
          </div>
        )}

        {/* 5. Order Details Modal */}
        {selectedOrderDetail && (
          <BuyerOrderDetailModal
            order={selectedOrderDetail}
            onClose={() => setSelectedOrderDetail(null)}
            onCancelOrder={handleCancelOrder}
          />
        )}
      </div>
    </BuyerLayout>
  );
}
