'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import OrderTimeline from '@/components/buyer/orders/OrderTimeline';
import {
  Truck,
  Search,
  RefreshCw,
  X,
  Package,
  Sprout,
  AlertCircle,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';

function TrackOrdersContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams ? (searchParams.get('orderId') || '') : '';

  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearchId, setOrderSearchId] = useState(initialOrderId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchedNotFound, setSearchedNotFound] = useState(false);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      setSearchedNotFound(false);

      // Fetch all buyer's orders
      const res = await fetch('/api/buyer/orders');
      const json = await res.json();

      if (json.success && json.data) {
        const allOrders = json.data.orders || [];
        // Filter strictly active orders: not Completed and not Cancelled
        const activeOnly = allOrders.filter(
          (o) => !['Completed', 'Cancelled'].includes(o.status)
        );
        setActiveOrders(activeOnly);

        // If an initial orderId query parameter was passed, try to find it
        if (initialOrderId) {
          const match = allOrders.find(
            (o) => o.orderNumber.toLowerCase() === initialOrderId.toLowerCase() || String(o.id) === initialOrderId
          );
          if (match) {
            setSelectedOrder(match);
          } else {
            setSearchedNotFound(true);
          }
        } else if (activeOnly.length > 0) {
          setSelectedOrder(activeOnly[0]);
        }
      } else {
        setError(json.error || 'Failed to load tracking data.');
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError('Network error while connecting to tracking service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const handleSearchOrder = async (e) => {
    e.preventDefault();
    setSearchedNotFound(false);
    const query = orderSearchId.trim();
    if (!query) return;

    try {
      setLoading(true);
      // Query server endpoint for order strictly owned by authenticated buyer
      const res = await fetch(`/api/buyer/orders/${encodeURIComponent(query)}`);
      const json = await res.json();

      if (json.success && json.data) {
        setSelectedOrder(json.data);
      } else {
        setSelectedOrder(null);
        setSearchedNotFound(true);
      }
    } catch (err) {
      console.error('Error searching order:', err);
      setSelectedOrder(null);
      setSearchedNotFound(true);
    } finally {
      setLoading(false);
    }
  };

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
                <Truck size={22} className="stroke-[2.5]" />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                Track Orders
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#4b5563', fontWeight: 500 }}>
              Track the progress of your active produce orders and mandi procurement lifecycle.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={fetchActiveOrders}
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
              href="/buyer/orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                color: '#15803d',
                border: '1.5px solid #bbf7d0',
                fontSize: '0.84rem',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <Package size={16} />
              <span>All Orders</span>
            </Link>
          </div>
        </div>

        {/* 2. Order ID Search Bar */}
        <form onSubmit={handleSearchOrder} style={{ display: 'flex', gap: '12px', maxWidth: '640px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              id="buyer-track-search-input"
              value={orderSearchId}
              onChange={(e) => {
                setOrderSearchId(e.target.value);
                setSearchedNotFound(false);
              }}
              placeholder="Enter Order ID (e.g., KF-ORD-123456)..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: '14px',
                border: '2px solid #e5e7eb',
                backgroundColor: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#1f2937',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {orderSearchId && (
              <button
                type="button"
                onClick={() => {
                  setOrderSearchId('');
                  setSearchedNotFound(false);
                  if (activeOrders.length > 0) setSelectedOrder(activeOrders[0]);
                }}
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

          <button
            type="submit"
            style={{
              padding: '12px 22px',
              borderRadius: '14px',
              backgroundColor: '#15803d',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
            }}
          >
            Track Order
          </button>
        </form>

        {/* 3. Search Not Found Alert */}
        {searchedNotFound && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1.5px solid #fecaca',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991b1b',
            maxWidth: '640px',
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900 }}>No matching order found</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#b91c1c' }}>
                We could not find an order matching &quot;{orderSearchId}&quot; in your account. Please check the Order ID.
              </p>
            </div>
          </div>
        )}

        {/* 4. Tracking Layout or Authentic Empty State */}
        {loading && !selectedOrder ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
            <p style={{ fontWeight: 600 }}>Loading live tracking data...</p>
          </div>
        ) : error ? (
          <div className="buyer-empty-box">
            <div className="buyer-empty-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#991b1b', margin: 0 }}>
              Unable to load tracking
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, maxWidth: '400px' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchActiveOrders}
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
        ) : activeOrders.length === 0 && !selectedOrder ? (
          /* Empty State: No active orders */
          <div className="buyer-empty-box">
            <div className="buyer-empty-icon-wrap">
              <Truck size={30} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              No active orders 🚜
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
              You are all caught up! Once you place a procurement order, you can track its live progress here.
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
          </div>
        ) : (
          /* Main Split Tracking Layout */
          <div className="buyer-tracking-layout">
            {/* Left Column: Active Orders Picker */}
            <div className="buyer-tracking-picker-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Active Orders ({activeOrders.length})
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>
                  Live Tracking
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeOrders.map((ord) => {
                  const isSelected = selectedOrder && selectedOrder.id === ord.id;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrder(ord);
                        setOrderSearchId(ord.orderNumber);
                        setSearchedNotFound(false);
                      }}
                      className={`buyer-tracking-order-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                          {ord.cropName}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: isSelected ? '#dcfce7' : '#f3f4f6',
                          color: isSelected ? '#15803d' : '#6b7280',
                        }}>
                          {ord.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
                        <span>{ord.orderNumber}</span>
                        <span style={{ fontWeight: 800, color: '#15803d' }}>
                          {ord.quantity} {ord.unit || 'kg'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                        <Building2 size={12} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ord.procurementCentre || 'Mandi Samiti'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Tracking Timeline */}
            <div>
              {selectedOrder ? (
                <OrderTimeline order={selectedOrder} />
              ) : (
                <div className="buyer-empty-box" style={{ margin: 0 }}>
                  <Package size={28} style={{ color: '#9ca3af' }} />
                  <p style={{ fontWeight: 600, color: '#6b7280' }}>Select an order from the list to view its live tracking timeline.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}

export default function BuyerTrackOrdersPage() {
  return (
    <Suspense fallback={
      <BuyerLayout>
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#6b7280' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
          <p style={{ fontWeight: 600 }}>Loading live tracking...</p>
        </div>
      </BuyerLayout>
    }>
      <TrackOrdersContent />
    </Suspense>
  );
}
