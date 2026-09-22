'use client';

import React, { useState, useEffect } from 'react';
import SupplierLayout from '@/components/supplier/SupplierLayout';
import { useAuth } from '@/context/AuthContext';
import {
  HelpCircle,
  Mail,
  Clock,
  ChevronDown,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  FileQuestion,
  ShieldCheck,
  Package,
  Boxes,
  Truck,
} from 'lucide-react';

const SUPPLIER_FAQS = [
  {
    question: 'How do I update farmer order fulfillment and dispatch status?',
    answer:
      'Go to the Orders tab on your sidebar. For each order, use the Status selector to advance the order from Pending → Confirmed → Shipped → Delivered. The farmer will immediately see the updated status in real-time on their portal.',
  },
  {
    question: 'What happens when product inventory falls below the low stock threshold?',
    answer:
      'When stock falls to or below your configured threshold (e.g. 10 bags), an alert is triggered in your "Low Stock Alerts" card and notification hub. You can click "Update Stock" at any time to replenish quantities.',
  },
  {
    question: 'How are farmer payments and settlements processed?',
    answer:
      'Farmer input procurement payments are processed via verified UPI / DBT mandi escrows. Settlements are routed directly to your registered supplier bank account upon dispatch verification.',
  },
  {
    question: 'Can I cancel an order if items are damaged or depleted?',
    answer:
      'Yes. You can select "Cancelled" from the order status dropdown. When an order is cancelled, any reserved stock is automatically returned to your available product inventory and the farmer is notified.',
  },
  {
    question: 'How do I add certified seed lots or new equipment bundles?',
    answer:
      'Click the "+ Add Product" button on your Dashboard or Products page. Provide product name, category, pricing, packaging unit, initial stock quantity, and specification details.',
  },
];

const ISSUE_CATEGORIES = [
  'Order Fulfillment Issue',
  'Inventory & Stock Discrepancy',
  'Farmer Delivery Address Issue',
  'Payment & Settlement Inquiry',
  'Account & Profile Update',
  'Other Technical Support',
];

export default function SupplierSupportPage() {
  const { user } = useAuth();

  // Accordion open state
  const [openFaq, setOpenFaq] = useState(0);

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Order Fulfillment Issue');
  const [relatedOrderId, setRelatedOrderId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await fetch('/api/support/tickets?role=supplier');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTickets(json.data);
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          description: description.trim(),
          relatedOrderId: relatedOrderId ? Number(relatedOrderId) : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFormMsg({
          type: 'success',
          text: `Ticket #${json.data?.ticketId || 'CREATED'} submitted successfully! Our support desk will respond shortly.`,
        });
        setSubject('');
        setDescription('');
        setRelatedOrderId('');
        fetchTickets();
      } else {
        setFormMsg({ type: 'error', text: json.error || 'Failed to submit support ticket.' });
      }
    } catch {
      setFormMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getTicketStatusBadge = (status) => {
    const s = String(status || 'OPEN').toUpperCase();
    if (s === 'OPEN') {
      return <span className="supplier-badge status-confirmed">OPEN</span>;
    }
    if (s === 'IN_PROGRESS') {
      return <span className="supplier-badge status-pending">IN PROGRESS</span>;
    }
    if (s === 'RESOLVED') {
      return <span className="supplier-badge status-delivered">RESOLVED</span>;
    }
    return <span className="supplier-badge status-cancelled">CLOSED</span>;
  };

  return (
    <SupplierLayout
      title="Help & Support"
      subtitle="Get help with products, inventory and supplier orders."
    >
      <div className="supplier-saas-content">
        {/* Top Cards Grid: Support Center & Contact Support */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Card 1: Support Center */}
          <div className="supplier-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HelpCircle size={22} />
              </div>
              <div>
                <h2 className="supplier-card-title" style={{ fontSize: '1.1rem' }}>
                  Support Center
                </h2>
                <p className="supplier-card-subtitle">
                  Operational guidance for inputs &amp; warehouse logistics.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: '#475569' }}>
                <Truck size={16} style={{ color: '#15803d', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Order Fulfillment:</strong> Advance orders through Confirmed → Shipped → Delivered.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: '#475569' }}>
                <Boxes size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Inventory Monitoring:</strong> Keep staple seed &amp; fertilizer stock above 15 units.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8rem', color: '#475569' }}>
                <ShieldCheck size={16} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                <span><strong>Certified Quality:</strong> Ensure all seed lots possess germination certification.</span>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Support */}
          <div className="supplier-contact-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="supplier-contact-icon">
                <Mail size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#14532d' }}>
                  Contact Support
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#166534', fontWeight: 600 }}>
                  KishanFlow Mandi &amp; Logistics Desk
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Official Desk Email:</span>
                <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#15803d' }}>support@kishanflow.com</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Clock size={15} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Desk Hours: <strong>08:00 AM – 08:00 PM IST (Mon – Sat)</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Split: FAQs on Left, Report a Problem on Right */}
        <div className="supplier-support-grid">
          {/* Card 3: Frequently Asked Questions */}
          <div className="supplier-card">
            <div className="supplier-card-header">
              <div>
                <h2 className="supplier-card-title">
                  <FileQuestion size={20} style={{ color: '#15803d' }} />
                  <span>Frequently Asked Questions</span>
                </h2>
                <p className="supplier-card-subtitle">
                  Quick answers regarding input listings, order lifecycles, and inventory.
                </p>
              </div>
            </div>

            <div className="supplier-faq-accordion">
              {SUPPLIER_FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`supplier-faq-item ${isOpen ? 'active' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="supplier-faq-trigger"
                    >
                      <span>{faq.question}</span>
                      <div className="supplier-faq-icon">
                        <ChevronDown size={16} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="supplier-faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Report a Problem Form */}
          <div className="supplier-card">
            <div className="supplier-card-header">
              <div>
                <h2 className="supplier-card-title">
                  <MessageSquare size={18} style={{ color: '#15803d' }} />
                  <span>Report a Problem</span>
                </h2>
                <p className="supplier-card-subtitle">
                  Submit an inquiry directly to the operations team.
                </p>
              </div>
            </div>

            {formMsg.text && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: formMsg.type === 'error' ? '#fee2e2' : '#dcfce7',
                  border: '1px solid',
                  borderColor: formMsg.type === 'error' ? '#fecaca' : '#bbf7d0',
                  color: formMsg.type === 'error' ? '#b91c1c' : '#15803d',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {formMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{formMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="supplier-form-group">
                <label className="supplier-form-label">
                  Issue Subject <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Discrepancy in Seed Lot #54"
                  className="supplier-form-input"
                />
              </div>

              <div className="supplier-form-group">
                <label className="supplier-form-label">
                  Category <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="supplier-form-select"
                >
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="supplier-form-group">
                <label className="supplier-form-label">
                  Related Order ID (Optional)
                </label>
                <input
                  type="text"
                  value={relatedOrderId}
                  onChange={(e) => setRelatedOrderId(e.target.value)}
                  placeholder="e.g. SO-1002"
                  className="supplier-form-input"
                />
              </div>

              <div className="supplier-form-group">
                <label className="supplier-form-label">
                  Detailed Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the issue with relevant batch numbers, farmer delivery locations or quantities..."
                  className="supplier-form-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="supplier-btn-primary"
                style={{ justifyContent: 'center', marginTop: '4px' }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Submit Support Ticket</span>
              </button>
            </form>
          </div>
        </div>

        {/* Existing Tickets Submitted by Supplier */}
        {tickets.length > 0 && (
          <div className="supplier-card">
            <div className="supplier-card-header">
              <div>
                <h2 className="supplier-card-title">Your Submitted Tickets</h2>
                <p className="supplier-card-subtitle">
                  Track resolution status of your reported inquiries.
                </p>
              </div>
            </div>

            <div className="supplier-table-container">
              <table className="supplier-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, color: '#15803d' }}>
                        {t.ticketId}
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {t.subject}
                      </td>
                      <td style={{ color: '#475569' }}>
                        {t.category}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        {getTicketStatusBadge(t.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SupplierLayout>
  );
}
