'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  Truck,
  Package,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'mandi-escrow', label: 'Mandi Samiti Escrow Settlement', desc: 'Protected funds released upon APMC weighbridge clearance' },
  { id: 'dbt-bank', label: 'Direct Benefit Transfer (DBT / NEFT)', desc: 'Direct Aadhaar-linked agricultural bank disbursement' },
  { id: 'upi-mandi', label: 'UPI / Bharat Mandi Mandate', desc: 'Instant authorized UPI settlement' },
];

export default function PaymentConfirmationModal({ order, onClose, onPaymentSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].label);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!order) return null;

  const handleConfirmAndPay = async (simulateFailure = false) => {
    try {
      setProcessing(true);
      setErrorMsg('');

      const res = await fetch('/api/buyer/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: selectedMethod,
          simulateFailure,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setPaymentResult(json.data);
        if (onPaymentSuccess) {
          onPaymentSuccess(json.data);
        }
      } else {
        setErrorMsg(json.error || 'Payment execution was declined.');
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      setErrorMsg('Network error while communicating with payment service.');
    } finally {
      setProcessing(false);
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
      onClick={() => !processing && onClose()}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
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
        {/* ======================================================== */}
        {/* STATE 1: PAYMENT SUCCESSFUL (Requirement 11)              */}
        {/* ======================================================== */}
        {paymentResult && paymentResult.status === 'PAID' ? (
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '2px solid #86efac',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
              ✓ Payment Successful
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 24px' }}>
              Your payment has been successfully recorded and linked to this order. The farmer has been notified of payment receipt.
            </p>

            <div
              style={{
                backgroundColor: '#fafaf7',
                border: '1px solid #f3f4f6',
                borderRadius: '16px',
                padding: '16px 20px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.84rem',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Order ID</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{paymentResult.orderNumber || order.orderNumber}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Amount Paid</span>
                <strong style={{ color: '#15803d', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                  ₹{Number(paymentResult.amount || order.totalAmount).toLocaleString('en-IN')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Payment ID</span>
                <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>
                  {paymentResult.paymentNumber || `KF-PAY-${paymentResult.id}`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Transaction Reference</span>
                <span style={{ color: paymentResult.transactionId ? '#0f172a' : '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }}>
                  {paymentResult.transactionId || 'Awaiting gateway ref'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                href={`/buyer/orders`}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Package size={15} />
                <span>View Order</span>
              </Link>

              <Link
                href={`/buyer/track-orders?orderId=${encodeURIComponent(order.orderNumber)}`}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
                }}
              >
                <Truck size={15} />
                <span>Track Order</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STATE 2: CONFIRM PAYMENT SECTION (Requirement 9)         */
          /* ======================================================== */
          <>
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                    Confirm Payment
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                    Order: {order.orderNumber}
                  </span>
                </div>
              </div>

              {!processing && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1.5px solid #fca5a5',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: '#991b1b',
                    fontSize: '0.84rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Payment failed:</strong> {errorMsg}
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleConfirmAndPay(false)}
                        style={{
                          backgroundColor: '#b91c1c',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary Grid */}
              <div
                style={{
                  backgroundColor: '#fafaf7',
                  border: '1px solid #f3f4f6',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '0.84rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Order ID:</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{order.orderNumber}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Crop:</span>
                  <strong style={{ color: '#0f172a' }}>{order.cropName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Quantity:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {order.quantity} {order.unit || 'kg'}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px dashed #e2e8f0',
                    paddingTop: '10px',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#1e293b', fontWeight: 800 }}>Total Payable Amount:</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803d', fontFamily: 'monospace' }}>
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label style={{ fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  Payment Method
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.label;
                    return (
                      <div
                        key={method.id}
                        onClick={() => !processing && setSelectedMethod(method.label)}
                        style={{
                          border: `1.5px solid ${isSelected ? '#15803d' : '#e2e8f0'}`,
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          cursor: processing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#15803d' : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && (
                            <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#15803d' }} />
                          )}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: 'block' }}>
                            {method.label}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {method.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                <ShieldCheck size={16} color="#15803d" />
                <span>Protected by KishanFlow Escrow Protocol. Payment is verified and linked strictly to this order.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                backgroundColor: '#fafaf7',
              }}
            >
              {!processing && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                disabled={processing}
                onClick={() => handleConfirmAndPay(false)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)',
                  opacity: processing ? 0.75 : 1,
                }}
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Confirm & Pay ₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
