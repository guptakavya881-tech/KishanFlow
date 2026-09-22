'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Clock,
  Search,
  Warehouse,
  Users,
  CheckCircle2,
  Package,
  Calendar,
  X,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Building2,
  Sprout,
  Check,
  Ticket,
  Scale,
  ArrowRight,
} from 'lucide-react';

export default function AdminQueuePage() {
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState(null);
  const [centreQueue, setCentreQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

  // Action / Completion modal state
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Load all centres
  const loadCentres = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/centres');
      const json = await res.json();
      if (json.success && json.data?.centres) {
        setCentres(json.data.centres);
        if (!selectedCentreId && json.data.centres.length > 0) {
          setSelectedCentreId(json.data.centres[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading centres:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load specific centre queue
  const loadQueue = async (centreId) => {
    if (!centreId) return;
    try {
      setQueueLoading(true);
      const res = await fetch(`/api/admin/queue?centreId=${encodeURIComponent(centreId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCentreQueue(json.data);
      }
    } catch (err) {
      console.error('Error loading queue:', err);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    loadCentres();
  }, []);

  useEffect(() => {
    if (selectedCentreId) {
      loadQueue(selectedCentreId);
    }
  }, [selectedCentreId]);

  // Handle advancing status (e.g. to IN_QUEUE or WEIGHING_VERIFICATION)
  const handleAdvanceStatus = async (orderId, nextStatus, note) => {
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'advanceStatus',
          orderId,
          nextStatus,
          note,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`Order updated to ${nextStatus}.`);
        loadQueue(selectedCentreId);
        setTimeout(() => setActionSuccessMsg(null), 2500);
      } else {
        alert(json.error || 'Failed to update order queue status.');
      }
    } catch (err) {
      console.error('Error advancing status:', err);
      alert('Network error while updating queue status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle completing procurement
  const handleCompleteProcurement = async () => {
    if (!confirmingOrder) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const res = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeProcurement',
          orderId: confirmingOrder.orderId || (confirmingOrder.type === 'ORDER' ? confirmingOrder.id : null),
          tokenNumber: confirmingOrder.tokenNumber,
          bookingId: confirmingOrder.bookingId || (confirmingOrder.type === 'BOOKING' ? confirmingOrder.id : null),
          farmerId: confirmingOrder.farmerId,
          farmerCropId: confirmingOrder.farmerCropId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`✓ Procurement marked complete for ${confirmingOrder.orderNumber || confirmingOrder.tokenNumber}!`);
        loadQueue(selectedCentreId);
        setTimeout(() => {
          setConfirmingOrder(null);
          setActionSuccessMsg(null);
          setActionError(null);
        }, 1500);
      } else {
        setActionError(json.error || 'Failed to complete procurement.');
      }
    } catch (err) {
      console.error('Error completing procurement:', err);
      setActionError('Network error while completing procurement.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
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
                <Clock size={22} />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Procurement Queue Management ⏱️
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b' }}>
              Live mandi tokens, active queue progression, weighment verification, and completion workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadQueue(selectedCentreId)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            }}
          >
            <RefreshCw size={14} className={queueLoading ? 'animate-spin' : ''} />
            <span>Sync Live Queue</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {actionSuccessMsg && (
          <div style={{
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            color: '#15803d',
            fontWeight: 800,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={18} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Centre Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}>
          {centres.map((c) => {
            const isSelected = selectedCentreId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCentreId(c.id)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  backgroundColor: isSelected ? '#15803d' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#1e293b',
                  border: isSelected ? '1.5px solid #15803d' : '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(21, 128, 61, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                <Warehouse size={18} color={isSelected ? '#ffffff' : '#15803d'} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem' }}>{c.name}</strong>
                  <span style={{ fontSize: '0.74rem', opacity: isSelected ? 0.9 : 0.7 }}>
                    {c.activeOrdersCount || 0} active orders
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Centre Queue Metrics Grid */}
        <div className="admin-stats-grid">
          {/* Current Serving Token Card */}
          <div className="admin-stat-card" style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            border: '1.5px solid #bbf7d0',
          }}>
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
              <Ticket size={22} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Now Serving Token</span>
              <span className="admin-stat-value" style={{ color: '#15803d', fontFamily: 'monospace' }}>
                {centreQueue?.currentServingToken ? `#${centreQueue.currentServingToken}` : 'None'}
              </span>
              <span className="admin-stat-subtext">
                {centreQueue?.currentServingToken ? 'Active procurement at counter' : 'No active token being served'}
              </span>
            </div>
          </div>

          {/* Active Queue Length Card */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
              <Users size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Active Queue Length</span>
              <span className="admin-stat-value">{centreQueue?.activeQueueLength ?? 0}</span>
              <span className="admin-stat-subtext">Total active entries in queue</span>
            </div>
          </div>

          {/* Orders Waiting Card */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
              <Clock size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Orders Waiting</span>
              <span className="admin-stat-value">{centreQueue?.ordersWaiting ?? 0}</span>
              <span className="admin-stat-subtext">Awaiting weighbridge slot</span>
            </div>
          </div>

          {/* Completed Procurements Card */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-label">Procurements Completed</span>
              <span className="admin-stat-value">{centreQueue?.completedProcurementsCount ?? 0}</span>
              <span className="admin-stat-subtext">Processed through this mandi</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Live Active Queue vs Completed Procurements */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'active' ? '#15803d' : 'transparent',
              color: activeTab === 'active' ? '#ffffff' : '#64748b',
              transition: 'all 0.18s ease',
            }}
          >
            Live Active Queue ({centreQueue?.activeQueueLength ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: activeTab === 'completed' ? '#15803d' : 'transparent',
              color: activeTab === 'completed' ? '#ffffff' : '#64748b',
              transition: 'all 0.18s ease',
            }}
          >
            Completed Procurements ({centreQueue?.completedProcurementsCount ?? 0})
          </button>
        </div>

        {/* Table Content */}
        {activeTab === 'active' ? (
          <div className="admin-table-container">
            {queueLoading && !centreQueue ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
                <p style={{ fontWeight: 600 }}>Syncing mandi queue state...</p>
              </div>
            ) : !centreQueue || centreQueue.activeQueue?.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Clock size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                  No active queue at this procurement centre.
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                  Active scheduled orders assigned to {centreQueue?.centre?.name || 'this centre'} will appear here in chronological sequence.
                </p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Token #</th>
                    <th>Order / Booking</th>
                    <th>Farmer</th>
                    <th>Crop &amp; Volume</th>
                    <th>Current Stage</th>
                    <th>People Ahead</th>
                    <th>Mandi Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {centreQueue.activeQueue.map((item) => {
                    const isServing = item.isServing;
                    return (
                      <tr
                        key={item.tokenNumber}
                        style={{
                          backgroundColor: isServing ? '#f0fdf4' : 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              backgroundColor: isServing ? '#15803d' : '#f1f5f9',
                              color: isServing ? '#ffffff' : '#334155',
                              fontWeight: 900,
                              fontSize: '0.86rem',
                            }}
                          >
                            #{item.queuePosition}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              fontFamily: 'monospace',
                              fontWeight: 900,
                              fontSize: '0.92rem',
                            }}
                          >
                            #{item.tokenNumber}
                          </span>
                        </td>
                        <td>
                          <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.88rem' }}>
                            {item.orderNumber || item.bookingNumber}
                          </strong>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {item.buyerName || 'Verified Buyer'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.88rem' }}>
                            {item.farmerName}
                          </strong>
                          {item.farmerMobile && (
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {item.farmerMobile}
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>
                            {item.quantity} {item.unit}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>
                            {item.cropName}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            backgroundColor: isServing ? '#dcfce7' : '#f1f5f9',
                            color: isServing ? '#15803d' : '#475569',
                          }}>
                            {isServing ? 'NOW SERVING' : item.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: item.peopleAhead === 0 ? '#15803d' : '#64748b' }}>
                            {item.peopleAhead === 0 ? 'Your Turn' : `${item.peopleAhead} ahead`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {item.status !== 'IN_QUEUE' && item.status !== 'WEIGHING_VERIFICATION' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleAdvanceStatus(item.orderId || item.id, 'IN_QUEUE', 'Mandi gate entry registered.')}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  color: '#334155',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                Start Bay
                              </button>
                            )}

                            {item.status !== 'WEIGHING_VERIFICATION' && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleAdvanceStatus(item.orderId || item.id, 'WEIGHING_VERIFICATION', 'Crop moisture and weighbridge verification initiated.')}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #fed7aa',
                                  backgroundColor: '#fff7ed',
                                  color: '#c2410c',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                Weighing
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setConfirmingOrder(item)}
                              className="admin-proc-complete-btn"
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              <span>✓ Complete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="admin-table-container">
            {!centreQueue?.completedProcurements || centreQueue.completedProcurements.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                  No completed procurements recorded yet.
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                  Procurements marked as complete by administrators at this centre will appear here.
                </p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Token</th>
                    <th>Farmer</th>
                    <th>Crop &amp; Quantity</th>
                    <th>Buyer</th>
                    <th>Status</th>
                    <th>Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {centreQueue.completedProcurements.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>
                          {item.orderNumber}
                        </strong>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                        }}>
                          #{item.tokenNumber}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>
                          {item.farmerName}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>
                          {item.quantity} {item.unit}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                          {item.cropName}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                          {item.buyerName || 'Verified Buyer'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                        }}>
                          <CheckCircle2 size={12} />
                          <span>PROCUREMENT COMPLETED</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {item.completedAt ? new Date(item.completedAt).toLocaleString('en-IN') : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Confirmation Modal for Marking Procurement Complete */}
        {confirmingOrder && (
          <div className="admin-modal-overlay" onClick={() => { setConfirmingOrder(null); setActionError(null); }}>
            <div
              className="admin-modal-panel"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px' }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <CheckCircle2 size={28} />
              </div>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                Mark Procurement Complete?
              </h2>

              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                You are completing physical mandi intake for <strong>{confirmingOrder.cropName}</strong> (Token <strong>#{confirmingOrder.tokenNumber}</strong>) from farmer <strong>{confirmingOrder.farmerName}</strong>.
              </p>

              {/* Action Error Alert Banner */}
              {actionError && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px',
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{actionError}</span>
                </div>
              )}

              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                fontSize: '0.84rem',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div><strong>Token #:</strong> #{confirmingOrder.tokenNumber}</div>
                <div><strong>Order #:</strong> {confirmingOrder.orderNumber || (confirmingOrder.orderId ? `KF-ORD-${confirmingOrder.orderId}` : (confirmingOrder.type === 'ORDER' ? `KF-ORD-${confirmingOrder.id}` : 'Order not linked yet'))}</div>
                <div><strong>Farmer:</strong> {confirmingOrder.farmerName}</div>
                <div><strong>Crop &amp; Quantity:</strong> {confirmingOrder.cropName} • {confirmingOrder.quantity} {confirmingOrder.unit}</div>
                <div><strong>Procurement Centre:</strong> {centreQueue?.centre?.name || 'Mandi Centre'}</div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => { setConfirmingOrder(null); setActionError(null); }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleCompleteProcurement}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Confirm Completion</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
