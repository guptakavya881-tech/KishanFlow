'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/context/AuthContext';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  X,
  Package,
  IndianRupee,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Warehouse,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Receipt,
  FileText,
} from 'lucide-react';

export default function BuyerPurchaseHistoryPage() {
  const { user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [metrics, setMetrics] = useState({
    totalPurchases: 0,
    totalQuantity: 0,
    totalSpent: 0,
    paidPurchases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'

  // Selected purchase for Detail Modal
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        paymentStatus: paymentFilter,
        sortBy,
      });

      const res = await fetch(`/api/buyer/purchase-history?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.purchases)) {
        setPurchases(data.purchases);
        setMetrics(data.metrics || {
          totalPurchases: data.purchases.length,
          totalQuantity: 0,
          totalSpent: 0,
          paidPurchases: 0,
        });
      } else {
        setError(data.error || 'Failed to load purchase history.');
      }
    } catch (err) {
      console.error('Error fetching purchase history:', err);
      setError('Unable to load purchase records. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, paymentFilter, sortBy]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const hasPurchases = purchases.length > 0;
  const isFiltering = searchTerm.trim() !== '' || paymentFilter !== 'ALL';

  return (
    <BuyerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <History size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#111827' }}>
                  Purchase History
                </h1>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#6b7280' }}>
                  Audited historical procurements, mandi batch weights, and payment settlement records.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPurchases}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e5e7eb',
              color: '#374151',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Real Metrics Summary Strip (Only shown when historical purchases exist) */}
        {metrics.totalPurchases > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '16px 20px',
              border: '1.5px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Package size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>
                  Completed Lots
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#111827', marginTop: '2px', display: 'block' }}>
                  {metrics.totalPurchases}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '16px 20px',
              border: '1.5px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Warehouse size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>
                  Total Volume
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#111827', marginTop: '2px', display: 'block' }}>
                  {metrics.totalQuantity.toLocaleString('en-IN')} kg
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '16px 20px',
              border: '1.5px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#fefce8',
                color: '#ca8a04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <IndianRupee size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>
                  Settled Amount
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803d', marginTop: '2px', display: 'block' }}>
                  ₹{metrics.totalSpent.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '16px 20px',
              border: '1.5px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', display: 'block' }}>
                  Paid Settlement
                </span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#166534', marginTop: '2px', display: 'block' }}>
                  {metrics.paidPurchases} of {metrics.totalPurchases}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e5e7eb',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f9fafb',
            border: '1.5px solid #e5e7eb',
            borderRadius: '12px',
            padding: '7px 12px',
            flex: '1 1 240px',
            maxWidth: '360px',
          }}>
            <Search size={16} style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by Order ID, crop, farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                width: '100%',
                color: '#1f2937',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Group: Payment Status & Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Payment Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#6b7280' }}>Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#374151',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending / Processing</option>
              </select>
            </div>

            {/* Sort Order */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpDown size={14} style={{ color: '#9ca3af' }} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#374151',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #e5e7eb',
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280', fontWeight: 600 }}>
              Retrieving historical purchase records...
            </p>
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #fecaca',
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <Package size={36} style={{ color: '#dc2626' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#991b1b' }}>
              Error Loading Purchase History
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#6b7280' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={fetchPurchases}
              style={{
                marginTop: '8px',
                padding: '8px 20px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : !hasPurchases ? (
          /* Empty States */
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #bbf7d0',
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 4px 20px -4px rgba(21, 128, 61, 0.04)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d',
            }}>
              <History size={30} />
            </div>

            {isFiltering ? (
              <>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1f2937' }}>
                  No matching purchases found.
                </h3>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#6b7280', maxWidth: '380px' }}>
                  No historical purchases matched your current search or filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setPaymentFilter('ALL');
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: '1.5px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '6px',
                  }}
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#14532d' }}>
                  No purchase history yet 🌱
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280', maxWidth: '420px', lineHeight: 1.5 }}>
                  Completed purchases will appear here once your crop lots complete procurement at the designated mandi centre.
                </p>
                <Link
                  href="/buyer/browse"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    padding: '10px 22px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                  }}
                >
                  <span>Browse Available Produce</span>
                  <ChevronRight size={15} />
                </Link>
              </>
            )}
          </div>
        ) : (
          /* Purchases Cards List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {purchases.map((p) => {
              const isPaid = p.paymentStatus === 'PAID';
              const displayDate = p.paidAt || p.updatedAt || p.createdAt;
              const formattedDate = displayDate
                ? new Date(displayDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    border: '1.5px solid #e5e7eb',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    transition: 'border-color 0.18s ease, transform 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#86efac';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Top Row: Order ID, Status, Date & View Details */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    borderBottom: '1px solid #f3f4f6',
                    paddingBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        color: '#15803d',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '3px 9px',
                        borderRadius: '8px',
                      }}>
                        {p.orderNumber}
                      </span>

                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <CheckCircle2 size={13} />
                        <span>{p.status}</span>
                      </span>

                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        backgroundColor: isPaid ? '#ecfdf5' : '#fffbeb',
                        color: isPaid ? '#047857' : '#b45309',
                        border: isPaid ? '1px solid #a7f3d0' : '1px solid #fde68a',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}>
                        {isPaid ? 'PAID' : (p.paymentStatus || 'PENDING')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>
                        {formattedDate}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedPurchase(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#f9fafb',
                          border: '1.5px solid #d1d5db',
                          color: '#374151',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Eye size={14} style={{ color: '#15803d' }} />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '16px',
                  }}>
                    {/* Produce & Quantity */}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                        Produce &amp; Procured Quantity
                      </span>
                      <span style={{ fontSize: '0.94rem', fontWeight: 900, color: '#111827', marginTop: '2px', display: 'block' }}>
                        {p.cropName}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4b5563', marginTop: '1px', display: 'block' }}>
                        {p.actualQuantity || p.quantity} {p.unit}
                      </span>
                    </div>

                    {/* Farmer */}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                        Farmer Supplier
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                        {p.farmer?.name || 'Registered Mandi Farmer'}
                      </span>
                      {p.farmer?.location && (
                        <span style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: '1px', display: 'block' }}>
                          {p.farmer.location}
                        </span>
                      )}
                    </div>

                    {/* Procurement Centre */}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                        Procurement Centre
                      </span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#374151', marginTop: '2px', display: 'block' }}>
                        {p.procurementCentre || 'Mandi Samiti Compound'}
                      </span>
                      {p.bookingToken && (
                        <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700, marginTop: '1px', display: 'block' }}>
                          Token: {p.bookingToken}
                        </span>
                      )}
                    </div>

                    {/* Settlement Amount */}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                        Settlement Amount
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d', marginTop: '2px', display: 'block' }}>
                        ₹{Number(p.payment?.amount || p.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                      {p.payment?.transactionId && (
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '1px', display: 'block' }}>
                          Ref: {p.payment.transactionId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Purchase Detail Modal */}
        {selectedPurchase && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backdropFilter: 'blur(3px)',
            }}
            onClick={() => setSelectedPurchase(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '640px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                border: '1.5px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#111827' }}>
                      Historical Purchase Details
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                      Order: <strong style={{ color: '#15803d' }}>{selectedPurchase.orderNumber}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '4px',
                  }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* 1. Order & Crop Specs */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    1. Produce &amp; Quantity Specifications
                  </h4>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Produce Name</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.cropName}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Ordered Quantity</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.quantity} {selectedPurchase.unit}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Procured (Weighed)</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#15803d', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.actualQuantity || selectedPurchase.quantity} {selectedPurchase.unit}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Agreed Price Rate</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.agreedPrice ? `₹${selectedPurchase.agreedPrice}/${selectedPurchase.unit}` : 'Mandi MSP'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Farmer Supplier Information */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Farmer Supplier Details
                  </h4>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Farmer Name</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.farmer?.name || 'Registered Mandi Farmer'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Farm / Mandi Location</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#374151', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.farmer?.location || 'Regional Procurement Mandi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Procurement Location & Booking */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Procurement Centre &amp; Slot
                  </h4>

                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Mandi Centre</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.procurementCentre || 'Meerut Procurement Centre'}
                      </span>
                      {selectedPurchase.centreAddress && (
                        <span style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: '2px', display: 'block' }}>
                          {selectedPurchase.centreAddress}
                        </span>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>Procurement Token</span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#15803d', marginTop: '2px', display: 'block' }}>
                        {selectedPurchase.bookingToken || 'KF-TOKEN-DIRECT'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Payment & Settlement Receipt */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    4. Payment Settlement Breakdown
                  </h4>

                  <div style={{
                    backgroundColor: '#f0fdf4',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    border: '1.5px solid #bbf7d0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>Settlement Status</span>
                      <span style={{
                        fontSize: '0.76rem',
                        fontWeight: 900,
                        backgroundColor: selectedPurchase.paymentStatus === 'PAID' ? '#15803d' : '#d97706',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        {selectedPurchase.paymentStatus || 'PAID'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534' }}>Total Amount</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#14532d' }}>
                        ₹{Number(selectedPurchase.payment?.amount || selectedPurchase.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {selectedPurchase.payment?.paymentNumber && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #bbf7d0', paddingTop: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: '#166534' }}>Payment ID</span>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#14532d' }}>
                          {selectedPurchase.payment.paymentNumber}
                        </span>
                      </div>
                    )}

                    {selectedPurchase.payment?.transactionId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', color: '#166534' }}>Transaction Ref</span>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#14532d' }}>
                          {selectedPurchase.payment.transactionId}
                        </span>
                      </div>
                    )}

                    {selectedPurchase.payment?.method && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', color: '#166534' }}>Method</span>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#14532d' }}>
                          {selectedPurchase.payment.method}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
