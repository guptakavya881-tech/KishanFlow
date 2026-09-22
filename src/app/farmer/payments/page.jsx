'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import FarmerPaymentSummary from '@/components/farmer/payments/FarmerPaymentSummary';
import FarmerPaymentCard from '@/components/farmer/payments/FarmerPaymentCard';
import { CreditCard, Loader2, Sparkles, RefreshCw, AlertCircle, PackageCheck } from 'lucide-react';

export default function FarmerPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    completedCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/farmer/payments');
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        setSummary(data.summary || {
          totalEarned: 0,
          pendingAmount: 0,
          completedCount: 0,
          pendingCount: 0,
        });
      } else {
        setError(data.error || 'Failed to load payments.');
      }
    } catch (err) {
      console.error('Error fetching farmer payments:', err);
      setError('Network error while connecting to payment service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-5xl mx-auto select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#15803d] font-bold text-xs uppercase tracking-wider mb-1">
              <CreditCard size={16} className="text-[#15803d]" />
              <span>Direct Bank Settlement (DBT)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14532d]">
              Payments & Procurement Settlements
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Transparent tracking of Direct Benefit Transfers (DBT) and real procurement payments received from buyers for your confirmed orders.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={fetchPayments}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Cards (Data-driven, Section 13) */}
        <FarmerPaymentSummary summary={summary} />

        {/* Payments List or Empty State */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-emerald-600" />
            <span className="text-xs font-semibold">Loading payment records...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                Payment Records ({payments.length})
              </h2>
              <span className="text-xs text-slate-500">
                Sorted by most recent settlement
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {payments.map((p) => (
                <FarmerPaymentCard key={p.id} payment={p} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
              <CreditCard size={28} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">No payment settlements yet</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                When buyers complete procurement payments for your confirmed crops, Direct Benefit Transfer (DBT) receipts and settlement credits will be listed here.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/farmer/orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#15803d] text-white font-extrabold text-xs hover:bg-[#166534] transition-colors shadow-2xs"
              >
                <PackageCheck size={16} /> View Order Requests
              </Link>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
}
