'use client';

import React, { useState, useEffect } from 'react';
import SupplierLayout from '@/components/supplier/SupplierLayout';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react';

export default function SupplierInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockEdits, setStockEdits] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/supplier/products');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        const initial = {};
        (json.data || []).forEach((p) => {
          initial[p.id] = p.stock;
        });
        setStockEdits(initial);
      }
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockChange = (id, val) => {
    setStockEdits({
      ...stockEdits,
      [id]: val,
    });
  };

  const handleSaveStock = async (id) => {
    try {
      setSavingId(id);
      setMsg('');
      const res = await fetch(`/api/supplier/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockOnly: true,
          stock: Number(stockEdits[id]),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Stock level updated successfully.');
        fetchInventory();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      setMsg('Error saving stock.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SupplierLayout
      title="Inventory Management"
      subtitle="Monitor warehouse reserves, replenish thresholds, and adjust inventory."
    >
      <div className="supplier-saas-content">
        <div className="supplier-card">
          <div className="supplier-card-header">
            <div>
              <h2 className="supplier-card-title">Inventory &amp; Stock Levels</h2>
              <p className="supplier-card-subtitle">
                Real-time stock monitoring and immediate threshold adjustments.
              </p>
            </div>
          </div>

          {msg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{msg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px', color: '#15803d' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Loading inventory...</p>
            </div>
          ) : (
            <div className="supplier-table-container">
              <table className="supplier-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Min. Threshold</th>
                    <th>Current Stock</th>
                    <th>Stock Status</th>
                    <th style={{ textAlign: 'right' }}>Quick Update</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isOut = Number(p.stock) === 0;
                    const isLow = !isOut && Number(p.stock) <= Number(p.lowStockThreshold || 10);

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                            {p.name}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontWeight: 600 }}>
                          {p.lowStockThreshold} {p.unit || 'units'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              min={0}
                              value={stockEdits[p.id] !== undefined ? stockEdits[p.id] : p.stock}
                              onChange={(e) => handleStockChange(p.id, e.target.value)}
                              style={{
                                width: '80px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1.5px solid #cbd5e1',
                                backgroundColor: '#f8fafc',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                color: '#0f172a',
                              }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.unit}</span>
                          </div>
                        </td>
                        <td>
                          {isOut ? (
                            <span className="supplier-badge out-of-stock">Out of Stock</span>
                          ) : isLow ? (
                            <span className="supplier-badge low-stock">Low Stock</span>
                          ) : (
                            <span className="supplier-badge in-stock">Healthy</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            disabled={savingId === p.id}
                            onClick={() => handleSaveStock(p.id)}
                            className="supplier-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            {savingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            <span>Save</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SupplierLayout>
  );
}
