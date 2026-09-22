'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  HelpCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'Crop Listing Issue',
  'Order Issue',
  'Payment Issue',
  'Procurement Issue',
  'Queue Issue',
  'Account Issue',
  'Other',
];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket for Editing Status / Notes
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/support/tickets?role=admin&${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setTickets(json.data || []);
        if (json.metrics) {
          setMetrics(json.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching admin tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleOpenEdit = (ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status || 'OPEN');
    setEditNotes(ticket.adminNotes || '');
    setUpdateMsg('');
  };

  const handleSaveTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdating(true);
    setUpdateMsg('');

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId,
          status: editStatus,
          adminNotes: editNotes,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setUpdateMsg('Ticket status updated and user notified.');
        fetchTickets();
        setTimeout(() => {
          setSelectedTicket(null);
          setUpdateMsg('');
        }, 1200);
      } else {
        setUpdateMsg(data.error || 'Failed to update ticket.');
      }
    } catch {
      setUpdateMsg('Network error.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'OPEN').toUpperCase();
    if (s === 'OPEN') {
      return <span className="kf-badge open">OPEN</span>;
    }
    if (s === 'IN_PROGRESS') {
      return <span className="kf-badge in-progress">IN PROGRESS</span>;
    }
    if (s === 'RESOLVED') {
      return <span className="kf-badge resolved">RESOLVED</span>;
    }
    return <span className="kf-badge closed">CLOSED</span>;
  };

  return (
    <AdminLayout>
      <div className="admin-saas-content">
        {/* Header / Welcome Banner */}
        <div className="admin-welcome-banner">
          <div className="admin-welcome-text">
            <span className="admin-welcome-badge">
              <Sparkles size={13} />
              Operations Triage • User Support
            </span>
            <h1>Support Desk &amp; Issue Resolution</h1>
            <p>
              Monitor, triage, and resolve farmer &amp; buyer inquiries, procurement discrepancies, and gate tokens.
            </p>
          </div>

          <div className="admin-welcome-actions">
            <button
              onClick={fetchTickets}
              className="kf-btn-secondary"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Desk</span>
            </button>
          </div>
        </div>

        {/* 1. Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">Total Tickets</span>
              <div className="admin-stat-icon-wrap green">
                <MessageSquare size={18} />
              </div>
            </div>
            <p className="admin-stat-val">{metrics.total}</p>
            <p className="admin-stat-desc">All recorded incidents</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">Open Tickets</span>
              <div className="admin-stat-icon-wrap blue">
                <HelpCircle size={18} />
              </div>
            </div>
            <p className="admin-stat-val text-blue-800">{metrics.open}</p>
            <p className="admin-stat-desc">Requires initial triage</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">In Progress</span>
              <div className="admin-stat-icon-wrap amber">
                <Loader2 size={18} />
              </div>
            </div>
            <p className="admin-stat-val text-amber-800">{metrics.inProgress}</p>
            <p className="admin-stat-desc">Under mandi investigation</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-top">
              <span className="admin-stat-label">Resolved</span>
              <div className="admin-stat-icon-wrap emerald">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="admin-stat-val text-emerald-800">{metrics.resolved}</p>
            <p className="admin-stat-desc">Closed &amp; confirmed</p>
          </div>
        </div>

        {/* 2. Filters and Search Bar */}
        <div className="kf-settings-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, user, subject..."
                className="kf-form-input pl-9 pr-20"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 kf-btn-primary"
                style={{ padding: '5px 12px', fontSize: '0.72rem' }}
              >
                Search
              </button>
            </form>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="kf-form-select"
                style={{ width: 'auto', padding: '7px 12px' }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider">Status:</span>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`kf-tab-pill ${statusFilter === st ? 'active' : ''}`}
              >
                {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Tickets Table */}
        <div className="admin-section-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="p-16 text-center text-slate-500">
              <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Loading support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <HelpCircle size={36} className="text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 m-0">No support tickets found.</h3>
              <p className="text-xs text-slate-500 m-0">No tickets matching the selected filters are present in the system.</p>
            </div>
          ) : (
            <div className="kf-data-table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="kf-data-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>User / Producer</th>
                    <th>Category</th>
                    <th>Subject &amp; Issue Summary</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono font-bold text-emerald-900">
                        {t.ticketId}
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">{t.userName || `User #${t.userId}`}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {t.role || 'user'} • {t.userMobile || t.userEmail || ''}
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {t.category}
                        </span>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <p className="font-bold text-slate-800 m-0" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.subject}
                        </p>
                        <p className="text-xs text-slate-500 m-0 mt-0.5" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.description}
                        </p>
                      </td>
                      <td>
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="text-slate-500 text-xs">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="kf-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Edit3 size={13} />
                          <span>Respond</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Edit / Respond Modal */}
        {selectedTicket && (
          <div className="kf-modal-backdrop">
            <div className="kf-modal-dialog">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {selectedTicket.ticketId}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm m-0">Manage Support Ticket</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  style={{ background: 'none', border: 'none' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* User & Ticket info */}
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">User:</span>
                    <span className="font-bold text-slate-800">
                      {selectedTicket.userName || `User #${selectedTicket.userId}`} ({selectedTicket.role})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Category:</span>
                    <span className="font-bold text-slate-800">{selectedTicket.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Subject:</span>
                    <p className="font-bold text-slate-900 m-0">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">Issue Description:</span>
                    <p className="text-slate-700 leading-relaxed m-0">{selectedTicket.description}</p>
                  </div>
                  {(selectedTicket.relatedOrderId || selectedTicket.relatedPaymentId) && (
                    <div className="flex gap-4 pt-1 text-[11px] text-slate-500 border-t border-slate-200">
                      {selectedTicket.relatedOrderId && <span>Order: #{selectedTicket.relatedOrderId}</span>}
                      {selectedTicket.relatedPaymentId && <span>Payment: #{selectedTicket.relatedPaymentId}</span>}
                    </div>
                  )}
                </div>

                {updateMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 size={15} />
                    <span>{updateMsg}</span>
                  </div>
                )}

                {/* Status & Response Form */}
                <form onSubmit={handleSaveTicket} className="space-y-4">
                  <div className="kf-form-group">
                    <label className="kf-form-label">
                      Update Ticket Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="kf-form-select"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div className="kf-form-group">
                    <label className="kf-form-label">
                      Official Admin Note / Resolution Message
                    </label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Enter resolution notes or instructions for the user..."
                      className="kf-form-textarea"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 m-0">
                      This note will be visible to the user in their support ticket dashboard and in-app notifications.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="kf-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="kf-btn-primary"
                    >
                      {updating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>Save &amp; Notify User</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
