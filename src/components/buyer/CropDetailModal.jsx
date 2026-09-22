'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Sprout,
  MapPin,
  Building2,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Package,
  ArrowRight,
  AlertCircle,
  Truck,
} from 'lucide-react';

export default function CropDetailModal({ crop, onClose, onOrderPlaced }) {
  if (!crop) return null;

  const isAvailableNow = crop.harvestStatus === 'Ready for Procurement' || crop.availabilityStatus === 'Available Now';
  const formattedQuantity = typeof crop.quantity === 'number' ? crop.quantity.toLocaleString('en-IN') : crop.quantity;

  const [orderMode, setOrderMode] = useState(false);
  const [orderQty, setOrderQty] = useState(Math.min(100, typeof crop.quantity === 'number' ? crop.quantity : 100));
  const [offeredPrice, setOfferedPrice] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderError(null);

    const qtyNum = Number(orderQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setOrderError('Please enter a valid quantity greater than 0.');
      return;
    }

    if (crop.harvestStatus === 'Growing') {
      setOrderError('Orders cannot be placed for crops that are still growing.');
      return;
    }

    if (typeof crop.quantity === 'number' && qtyNum > crop.quantity) {
      setOrderError('Requested quantity exceeds available quantity.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/buyer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropId: crop.id,
          cropName: crop.cropName,
          quantity: qtyNum,
          unit: crop.unit || 'kg',
          procurementCentre: crop.procurementCentre,
          centreAddress: crop.centreAddress,
          expectedDate: crop.expectedHarvestDate,
          agreedPrice: offeredPrice && !isNaN(Number(offeredPrice)) && Number(offeredPrice) > 0 ? Number(offeredPrice) : undefined,
          deliveryNotes: deliveryNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setOrderSuccess(json.data);
        if (onOrderPlaced) onOrderPlaced(json.data);
      } else {
        setOrderError(json.error || 'Failed to place procurement order.');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setOrderError('Network error while recording procurement request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
          border: '1.5px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sprout size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                {crop.cropName}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600 }}>
                {crop.lotId} • Registered Produce
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Order Success Screen */}
          {orderSuccess ? (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '18px',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckCircle2 size={30} />
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#14532d' }}>
                  Procurement Request Created!
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#166534' }}>
                  Order ID: <strong>{orderSuccess.orderNumber}</strong>
                </p>
                <span style={{ fontSize: '0.78rem', color: '#4b5563', display: 'block', marginTop: '6px' }}>
                  Your request for {orderSuccess.quantity} {orderSuccess.unit} has been recorded and added to your orders.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                  href="/buyer/orders"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Package size={14} />
                  <span>View in My Orders</span>
                </Link>

                <Link
                  href={`/buyer/track-orders?orderId=${encodeURIComponent(orderSuccess.orderNumber)}`}
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    color: '#15803d',
                    border: '1.5px solid #bbf7d0',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Truck size={14} />
                  <span>Track Order</span>
                </Link>
              </div>
            </div>
          ) : orderMode ? (
            /* Order Creation Form */
            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#fafaf7',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1px solid #f3f4f6',
              }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#6b7280', display: 'block' }}>
                  Selected Crop
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                  {crop.cropName} • {crop.lotId}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                  Available in Lot: {formattedQuantity} {crop.unit || 'kg'}
                </span>
              </div>

              {orderError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{orderError}</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Requested Quantity ({crop.unit || 'kg'}):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    max={typeof crop.quantity === 'number' ? crop.quantity : 999999}
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #e5e7eb',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#1f2937',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setOrderQty(crop.quantity)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#fafaf7',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: '#15803d',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Offered Rate (₹/kg) <span style={{ color: '#6b7280', fontWeight: 500 }}>(Optional - sets agreed price)</span>:
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="e.g. 24.50"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #e5e7eb',
                    fontSize: '0.84rem',
                    color: '#1f2937',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {offeredPrice && !isNaN(Number(offeredPrice)) && Number(offeredPrice) > 0 && (
                  <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                    Est. Total: ₹{Math.round(Number(orderQty) * Number(offeredPrice)).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Procurement / Delivery Notes (Optional):
                </label>
                <textarea
                  rows="2"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g., Required for mill processing, quality check requested on delivery."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5e7eb',
                    fontSize: '0.84rem',
                    color: '#1f2937',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setOrderMode(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Back to Details
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Package size={15} />
                  <span>{submitting ? 'Placing Order...' : 'Confirm Procurement Request'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Standard Produce Inspection */
            <>
              {/* Status & Quantity Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                backgroundColor: '#fafaf7',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid #f3f4f6',
              }}>
                <div>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                    Available Volume
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d' }}>
                    {formattedQuantity} {crop.unit || 'kg'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 800, color: '#9ca3af', display: 'block' }}>
                    Procurement Status
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    {isAvailableNow ? (
                      <span className="buyer-crop-badge-available">
                        <CheckCircle2 size={12} />
                        <span>Ready for Procurement</span>
                      </span>
                    ) : (
                      <span className="buyer-crop-badge-coming-soon">
                        <Clock size={12} />
                        <span>{crop.harvestStatus}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} /> Expected Harvest
                  </span>
                  <span style={{ fontWeight: 800, color: '#1f2937' }}>{crop.expectedHarvestDate || 'Immediate'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={15} /> Mandi / Centre
                  </span>
                  <span style={{ fontWeight: 800, color: '#1f2937' }}>{crop.procurementCentre || 'Designated Mandi'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} /> Regional Zone
                  </span>
                  <span style={{ fontWeight: 800, color: '#1f2937' }}>{crop.location || 'Regional Zone'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} /> Quality Verification
                  </span>
                  <span style={{ fontWeight: 800, color: '#15803d' }}>Verified KishanFlow Farmer Lot</span>
                </div>
              </div>

              {crop.notes && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Farmer Crop Specifications
                  </span>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#1f2937', fontStyle: 'italic' }}>
                    &quot;{crop.notes}&quot;
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!orderSuccess && !orderMode && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #f3f4f6',
            backgroundColor: '#fafaf7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => setOrderMode(true)}
              style={{
                padding: '9px 22px',
                borderRadius: '10px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.84rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
              }}
            >
              <Package size={15} />
              <span>Create Procurement Request</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
