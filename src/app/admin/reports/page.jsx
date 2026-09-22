'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  BarChart3,
  Download,
  Users,
  Sprout,
  Package,
  IndianRupee,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState('ALL');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reports?timeRange=${timeRange}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAnalytics(json.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleExportCsv = () => {
    setExporting(true);
    window.location.href = `/api/admin/reports?export=csv&timeRange=${timeRange}`;
    setTimeout(() => setExporting(false), 2000);
  };

  const formatCurrency = (amt) => {
    const num = Number(amt) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (val) => {
    return new Intl.NumberFormat('en-IN').format(Number(val) || 0);
  };

  return (
    <AdminLayout>
      <div className="admin-saas-content">
        {/* Top Welcome / Header Banner */}
        <div className="admin-welcome-banner">
          <div className="admin-welcome-text">
            <span className="admin-welcome-badge">
              <BarChart3 size={13} />
              Operations Intelligence • Real-time Data
            </span>
            <h1>Reports &amp; Live Intelligence</h1>
            <p>
              Monitor procurement volume, crop listings, order fulfillment, and DBT settlements aggregated directly from live database records.
            </p>
          </div>

          <div className="admin-welcome-actions flex-wrap">
            {/* Time Filter Pills */}
            <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              {[
                { label: 'All Time', value: 'ALL' },
                { label: 'Today', value: 'TODAY' },
                { label: 'Last 7 Days', value: '7D' },
                { label: 'Last 30 Days', value: '30D' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setTimeRange(pill.value)}
                  className={`kf-tab-pill ${timeRange === pill.value ? 'active' : ''}`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="kf-btn-primary"
            >
              {exporting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {loading && !analytics ? (
          <div className="p-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
            <Loader2 size={36} className="animate-spin mx-auto text-emerald-600 mb-3" />
            <p className="text-sm font-bold text-slate-700">Calculating real-time database analytics...</p>
            <p className="text-xs text-slate-400 mt-1">Aggregating live crops, payments, and mandi tickets</p>
          </div>
        ) : !analytics ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <AlertCircle size={36} className="text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-900 m-0">No data available for this period.</h3>
            <p className="text-xs text-slate-500 m-0">Try changing the time filter range above.</p>
          </div>
        ) : (
          <>
            {/* 1. Top 4 Key Performance Metrics Cards */}
            <div className="admin-stats-grid">
              {/* Card 1: Users */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Registered Users</span>
                  <div className="admin-stat-icon-wrap green">
                    <Users size={18} />
                  </div>
                </div>
                <div>
                  <p className="admin-stat-val">{formatNumber(analytics.users.total)}</p>
                  <p className="admin-stat-desc">
                    <span className="font-bold text-emerald-700">{analytics.users.farmers}</span> Farmers •{' '}
                    <span className="font-bold text-amber-700">{analytics.users.buyers}</span> Buyers
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-3">
                  <span>Active Accounts: {analytics.users.active}</span>
                  <Link href="/admin/farmers" className="font-bold text-emerald-700 hover:underline flex items-center gap-0.5">
                    View <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Card 2: Crop Produce Volume */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Crop Listings</span>
                  <div className="admin-stat-icon-wrap green">
                    <Sprout size={18} />
                  </div>
                </div>
                <div>
                  <p className="admin-stat-val">{formatNumber(analytics.crops.total)}</p>
                  <p className="admin-stat-desc">
                    <span className="font-bold text-slate-800">{formatNumber(analytics.crops.totalVolumeKg)}</span> kg Total Produce
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-3">
                  <span>Ready Lots: {analytics.crops.ready}</span>
                  <Link href="/admin/crops" className="font-bold text-emerald-700 hover:underline flex items-center gap-0.5">
                    View <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Card 3: Order Volume */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Total Orders</span>
                  <div className="admin-stat-icon-wrap blue">
                    <Package size={18} />
                  </div>
                </div>
                <div>
                  <p className="admin-stat-val">{formatNumber(analytics.orders.total)}</p>
                  <p className="admin-stat-desc">
                    Gross Value: <span className="font-bold text-slate-800">{formatCurrency(analytics.orders.totalValue)}</span>
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-3">
                  <span>Delivered: {analytics.orders.delivered}</span>
                  <Link href="/admin/orders" className="font-bold text-blue-700 hover:underline flex items-center gap-0.5">
                    View <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Card 4: Payments Settled */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-label">Settled Payments</span>
                  <div className="admin-stat-icon-wrap amber">
                    <IndianRupee size={18} />
                  </div>
                </div>
                <div>
                  <p className="admin-stat-val text-emerald-800">{formatCurrency(analytics.payments.paidAmount)}</p>
                  <p className="admin-stat-desc">
                    <span className="font-bold text-emerald-700">{analytics.payments.paidCount}</span> Verified Transactions
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-3">
                  <span>Pending: {formatCurrency(analytics.payments.pendingAmount)}</span>
                  <Link href="/admin/payments" className="font-bold text-amber-700 hover:underline flex items-center gap-0.5">
                    View <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. Visual Distribution Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Distribution 1: Crop Harvest Status */}
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h3 className="admin-section-title">Crop Harvest Breakdown</h3>
                  <span className="text-xs font-bold text-slate-400">{analytics.crops.total} Total Lots</span>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-800">Ready for Procurement</span>
                      <span className="text-slate-700">{analytics.crops.ready} lots</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{
                          width: `${analytics.crops.total ? (analytics.crops.ready / analytics.crops.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-800">Nearly Ready</span>
                      <span className="text-slate-700">{analytics.crops.nearlyReady} lots</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${analytics.crops.total ? (analytics.crops.nearlyReady / analytics.crops.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-blue-800">Growing Stage</span>
                      <span className="text-slate-700">{analytics.crops.growing} lots</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${analytics.crops.total ? (analytics.crops.growing / analytics.crops.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribution 2: Order Fulfillment */}
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h3 className="admin-section-title">Order Execution Status</h3>
                  <span className="text-xs font-bold text-slate-400">{analytics.orders.total} Total Orders</span>
                </div>

                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-800">Delivered &amp; Procured</span>
                      <span className="text-slate-700">{analytics.orders.delivered}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{
                          width: `${analytics.orders.total ? (analytics.orders.delivered / analytics.orders.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-800">Pending / Processing</span>
                      <span className="text-slate-700">{analytics.orders.pending}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${analytics.orders.total ? (analytics.orders.pending / analytics.orders.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-red-700">Cancelled</span>
                      <span className="text-slate-700">{analytics.orders.cancelled}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{
                          width: `${analytics.orders.total ? (analytics.orders.cancelled / analytics.orders.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribution 3: Mandi Operations Efficiency */}
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h3 className="admin-section-title">Mandi &amp; Support SLA</h3>
                  <span className="text-xs font-bold text-slate-400">{analytics.centres.total} Centres</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">Avg Gate Wait</p>
                    <p className="text-xl font-black text-slate-900 mt-1 m-0">{analytics.centres.avgWaitTime} mins</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">Active Tokens</p>
                    <p className="text-xl font-black text-emerald-800 mt-1 m-0">{analytics.centres.activeTokens}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">Open Inquiries</p>
                    <p className="text-xl font-black text-blue-800 mt-1 m-0">{analytics.support.open}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">Resolved Issues</p>
                    <p className="text-xl font-black text-emerald-800 mt-1 m-0">{analytics.support.resolved}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Procurement Centres Activity */}
            <div className="admin-section-card">
              <div className="admin-section-header">
                <div>
                  <h3 className="admin-section-title">Procurement Centres &amp; Capacity Utilization</h3>
                  <p className="admin-section-sub">Live crowd states, registered bookings, and weighbridge turnaround</p>
                </div>
                <Link
                  href="/admin/centres"
                  className="kf-btn-secondary"
                >
                  Manage Centres <ArrowUpRight size={14} />
                </Link>
              </div>

              {analytics.centres.list.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No procurement centres registered in this jurisdiction yet.
                </div>
              ) : (
                <div className="kf-data-table-wrap">
                  <table className="kf-data-table">
                    <thead>
                      <tr>
                        <th>Centre Name</th>
                        <th>District / Mandi Location</th>
                        <th>Crowd Status</th>
                        <th>Est. Waiting Time</th>
                        <th>Today&apos;s Capacity</th>
                        <th style={{ textAlign: 'right' }}>Total Bookings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.centres.list.map((c) => (
                        <tr key={c.id}>
                          <td className="font-bold text-slate-900">{c.name}</td>
                          <td className="text-slate-500">{c.address}</td>
                          <td>
                            <span
                              className={`kf-badge ${
                                c.currentCrowd === 'Low'
                                  ? 'resolved'
                                  : c.currentCrowd === 'Moderate'
                                  ? 'in-progress'
                                  : 'closed'
                              }`}
                            >
                              {c.currentCrowd} Crowd
                            </span>
                          </td>
                          <td className="font-semibold text-slate-700">{c.estimatedWaitMins} mins</td>
                          <td className="font-semibold text-slate-700">{c.todayCapacityPercent}%</td>
                          <td style={{ textAlign: 'right' }} className="font-mono font-bold text-emerald-800">
                            {c.bookingsCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4. Drill-down: Recent Orders & Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders Table */}
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h3 className="admin-section-title">Recent Commercial Orders</h3>
                  <Link href="/admin/orders" className="kf-btn-secondary">
                    All Orders <ArrowUpRight size={13} />
                  </Link>
                </div>

                {analytics.recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No orders registered in the system yet.
                  </div>
                ) : (
                  <div className="kf-data-table-wrap">
                    <table className="kf-data-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Crop Produce</th>
                          <th>Contract Value</th>
                          <th style={{ textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentOrders.map((o) => (
                          <tr key={o.id}>
                            <td className="font-mono font-bold text-slate-900">{o.orderNumber}</td>
                            <td className="text-slate-700 font-medium">
                              {o.cropName} ({o.quantity} {o.unit})
                            </td>
                            <td className="font-bold text-slate-900">{formatCurrency(o.totalAmount)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span
                                className={`kf-badge ${
                                  o.status === 'DELIVERED'
                                    ? 'resolved'
                                    : o.status === 'CONFIRMED'
                                    ? 'open'
                                    : 'in-progress'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payments Table */}
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h3 className="admin-section-title">Recent Mandi Payments</h3>
                  <Link href="/admin/payments" className="kf-btn-secondary">
                    All Payments <ArrowUpRight size={13} />
                  </Link>
                </div>

                {analytics.recentPayments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No payment records registered in the system yet.
                  </div>
                ) : (
                  <div className="kf-data-table-wrap">
                    <table className="kf-data-table">
                      <thead>
                        <tr>
                          <th>Payment #</th>
                          <th>Crop Item</th>
                          <th>Amount</th>
                          <th style={{ textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="font-mono font-bold text-slate-900">{p.paymentNumber || `#${p.id}`}</td>
                            <td className="text-slate-700 font-medium">{p.cropName}</td>
                            <td className="font-bold text-emerald-800">{formatCurrency(p.amount)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span
                                className={`kf-badge ${
                                  String(p.status).toUpperCase() === 'PAID'
                                    ? 'resolved'
                                    : 'in-progress'
                                }`}
                              >
                                {p.status || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
