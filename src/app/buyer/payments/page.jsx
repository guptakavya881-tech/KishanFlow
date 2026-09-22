'use client';

import React, { useState, useEffect } from 'react';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import PaymentSummary from '@/components/buyer/payments/PaymentSummary';
import PayableOrderCard from '@/components/buyer/payments/PayableOrderCard';
import PaymentList from '@/components/buyer/payments/PaymentList';
import PaymentConfirmationModal from '@/components/buyer/payments/PaymentConfirmationModal';
import { IndianRupee, Loader2, RefreshCw, AlertCircle, PackageCheck, Clock } from 'lucide-react';

export default function BuyerPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payableOrders, setPayableOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalPaid: 0,
    pendingAmount: 0,
  });

  const [activeTab, setActiveTab] = useState('payable'); // 'payable' | 'history'
  const [orderToPay, setOrderToPay] = useState(null);

  const fetchPaymentsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/buyer/payments');
      const json = await res.json();

      if (json.success && json.data) {
        setPayments(json.data.payments || []);
        setPayableOrders(json.data.payableOrders || []);
        if (json.data.summary) {
          setSummary(json.data.summary);
        }
      } else {
        setError(json.error || 'Failed to fetch payment records.');
      }
    } catch (err) {
      console.error('Error loading buyer payments:', err);
      setError('Network error while connecting to payment service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const handlePaymentSuccess = () => {
    fetchPaymentsData();
  };

  return (
    <BuyerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Header Banner */}
        <div className="buyer-orders-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IndianRupee size={22} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
                Payments & Settlements
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
              Transparent order-linked Mandi escrow settlement. View eligible orders, initiate payments, and track farmer payment reflections.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={fetchPaymentsData}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#334155',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards (Data-driven, 0 if empty) */}
        <PaymentSummary summary={summary} />

        {/* Navigation Tabs between Payable Orders and Payment History */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1.5px solid #e2e8f0',
            paddingBottom: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('payable')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 800,
              color: activeTab === 'payable' ? '#15803d' : '#64748b',
              borderBottom: activeTab === 'payable' ? '3px solid #15803d' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={16} />
            <span>Payable Orders</span>
            {payableOrders.length > 0 && (
              <span
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                }}
              >
                {payableOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 800,
              color: activeTab === 'history' ? '#15803d' : '#64748b',
              borderBottom: activeTab === 'history' ? '3px solid #15803d' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PackageCheck size={16} />
            <span>Payment History & Receipts</span>
            {payments.length > 0 && (
              <span
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                }}
              >
                {payments.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Loader2 size={22} className="animate-spin text-emerald-600" />
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Loading payment records...</span>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1.5px solid #fca5a5',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#991b1b',
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : activeTab === 'payable' ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                Orders Awaiting Payment
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Orders confirmed by farmers with a real payable amount can be paid here. Only eligible confirmed orders allow &quot;Pay Now&quot;.
              </p>
            </div>

            {payableOrders.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {payableOrders.map((order) => (
                  <PayableOrderCard
                    key={order.id}
                    order={order}
                    onPayNow={(ord) => setOrderToPay(ord)}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '20px',
                  padding: '50px 24px',
                  textAlign: 'center',
                  maxWidth: '560px',
                  margin: '20px auto',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <PackageCheck size={26} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                  No orders awaiting payment
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                  You currently have no confirmed procurement orders pending payment. Check &quot;My Orders&quot; to review request status.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                Completed Settlements & Receipts
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Real payment records linked to your procurement orders.
              </p>
            </div>

            <PaymentList payments={payments} />
          </div>
        )}

        {/* Payment Confirmation Modal */}
        {orderToPay && (
          <PaymentConfirmationModal
            order={orderToPay}
            onClose={() => setOrderToPay(null)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </BuyerLayout>
  );
}
