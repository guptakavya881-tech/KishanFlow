'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  HelpCircle,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  MessageSquare,
  FileQuestion,
  Loader2,
  ShieldCheck,
  Search,
  Check,
} from 'lucide-react';

const CATEGORIES = [
  'Crop Listing Issue',
  'Order Issue',
  'Payment Issue',
  'Procurement Issue',
  'Queue Issue',
  'Account Issue',
  'Other',
];

export default function SupportPortal({ userRole = 'farmer', faqs = [] }) {
  const { user } = useAuth();

  // Active tab: 'new-ticket' | 'my-tickets' | 'faq'
  const [activeTab, setActiveTab] = useState('new-ticket');

  // FAQ state
  const [openFaq, setOpenFaq] = useState(0);
  const [faqSearch, setFaqSearch] = useState('');

  // Tickets list
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Ticket Form
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Crop Listing Issue',
    description: '',
    relatedOrderId: '',
    relatedPaymentId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await fetch(`/api/support/tickets?role=${userRole}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTickets(json.data);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [userRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          category: formData.category,
          description: formData.description,
          relatedOrderId: formData.relatedOrderId ? Number(formData.relatedOrderId) : null,
          relatedPaymentId: formData.relatedPaymentId ? Number(formData.relatedPaymentId) : null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormMsg({
          type: 'success',
          text: `Ticket #${data.data?.ticketId || 'CREATED'} submitted successfully! Mandi operations will respond shortly.`,
        });
        setFormData({
          subject: '',
          category: 'Crop Listing Issue',
          description: '',
          relatedOrderId: '',
          relatedPaymentId: '',
        });
        fetchTickets();
        setTimeout(() => setActiveTab('my-tickets'), 2000);
      } else {
        setFormMsg({ type: 'error', text: data.error || 'Failed to submit ticket.' });
      }
    } catch {
      setFormMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
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

  const filteredFaqs = faqs.filter(
    (item) =>
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="kf-support-container pb-16">
      {/* 1. Header Banner & Tab Switcher */}
      <div className="kf-settings-banner">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <HelpCircle size={16} />
            <span>KishanFlow Mandi &amp; Operations Help Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight m-0">
            Help &amp; Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
            Find answers or get help with your KishanFlow journey.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl shrink-0 self-start md:self-auto border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('new-ticket')}
            className={`kf-tab-pill ${activeTab === 'new-ticket' ? 'active' : ''}`}
          >
            Report an Issue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-tickets')}
            className={`kf-tab-pill ${activeTab === 'my-tickets' ? 'active' : ''}`}
          >
            <span>My Tickets</span>
            {tickets.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                {tickets.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`kf-tab-pill ${activeTab === 'faq' ? 'active' : ''}`}
          >
            Frequently Asked Questions
          </button>
        </div>
      </div>

      {/* 2. Tab: Report an Issue */}
      {activeTab === 'new-ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Support Form */}
          <div className="lg:col-span-2 kf-settings-card">
            <div className="kf-settings-card-header">
              <div className="kf-card-icon-box green">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="kf-settings-card-title">Submit a Support Ticket</h2>
                <p className="kf-settings-card-sub">
                  Provide details so our mandi operations desk can triage and investigate quickly.
                </p>
              </div>
            </div>

            {formMsg.text && (
              <div
                className={`mb-5 p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {formMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{formMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="kf-form-group">
                <label className="kf-form-label">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="kf-form-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kf-form-group">
                <label className="kf-form-label">
                  Subject / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Delayed token verification at Meerut procurement centre"
                  className="kf-form-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Related Order ID (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.relatedOrderId}
                    onChange={(e) => setFormData({ ...formData, relatedOrderId: e.target.value })}
                    placeholder="e.g. 1"
                    className="kf-form-input"
                  />
                </div>

                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Related Payment ID (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.relatedPaymentId}
                    onChange={(e) => setFormData({ ...formData, relatedPaymentId: e.target.value })}
                    placeholder="e.g. 1"
                    className="kf-form-input"
                  />
                </div>
              </div>

              <div className="kf-form-group">
                <label className="kf-form-label">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the discrepancy, weighbridge slip number, or assistance needed..."
                  className="kf-form-textarea"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="kf-btn-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Support Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Helpline Info & SLAs */}
          <div className="space-y-6">
            <div className="kf-settings-card space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Phone size={16} className="text-emerald-600" />
                <span>Mandi Helpline Contacts</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed m-0">
                For urgent physical gate assistance, token printing issues, or weighbridge clarification:
              </p>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider m-0">
                  24/7 Farmer &amp; Buyer Toll-Free
                </p>
                <p className="text-lg font-black text-emerald-950 m-0">1800-180-1551</p>
                <p className="text-[11px] text-emerald-700 m-0 mt-1">Toll-free across regional procurement districts</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider m-0">
                  Direct Email Desk
                </p>
                <p className="text-xs font-bold text-slate-900 m-0">support@kishanflow.com</p>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5">Average response time: &lt; 2 business hours</p>
              </div>
            </div>

            <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-200 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Ticket Resolution Protocol</span>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed m-0">
                Every ticket is logged with a unique serial ID and monitored by APMC officials until official resolution. Weighbridge slips and DBT transactions are automatically reconciled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tab: My Tickets */}
      {activeTab === 'my-tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 m-0">Submitted Support Tickets</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">Track resolution status and mandi responses for your inquiries.</p>
            </div>
            <button
              onClick={() => setActiveTab('new-ticket')}
              className="kf-btn-secondary"
            >
              + Submit Another Ticket
            </button>
          </div>

          {loadingTickets ? (
            <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-slate-700">Loading your support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <FileQuestion size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-base m-0">No support tickets submitted yet.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
                If you encounter any difficulty with crop sales, order matching, or token wait times, report an issue and track it here.
              </p>
              <button
                onClick={() => setActiveTab('new-ticket')}
                className="kf-btn-primary"
              >
                Report an Issue Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id || t.ticketId}
                  className="kf-settings-card space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs font-mono text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {t.ticketId}
                      </span>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {t.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        {new Date(t.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm m-0">{t.subject}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5 m-0">{t.description}</p>
                  </div>

                  {(t.relatedOrderId || t.relatedPaymentId) && (
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      {t.relatedOrderId && <span>Related Order: #{t.relatedOrderId}</span>}
                      {t.relatedPaymentId && <span>Related Payment: #{t.relatedPaymentId}</span>}
                    </div>
                  )}

                  {t.adminNotes && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-800 text-[11px] uppercase tracking-wider m-0">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Admin Resolution Note
                      </p>
                      <p className="text-xs text-emerald-950 leading-relaxed m-0">{t.adminNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Tab: FAQs */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="kf-settings-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 m-0">Frequently Asked Questions</h2>
                <p className="text-xs text-slate-500 m-0 mt-0.5">Instant answers to common operational questions.</p>
              </div>

              {/* FAQ Search */}
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="kf-form-input pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {filteredFaqs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                <p className="text-xs font-bold">No FAQs matched your search query.</p>
              </div>
            ) : (
              filteredFaqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className={`kf-faq-item ${isOpen ? 'open' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="kf-faq-question"
                    >
                      <span>{item.question}</span>
                      <div className={`kf-faq-chevron ${isOpen ? 'open' : ''}`}>
                        <ChevronDown size={18} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="kf-faq-answer">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
