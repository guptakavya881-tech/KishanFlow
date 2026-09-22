'use client';

import React, { useState, useEffect } from 'react';
import SupplierLayout from '@/components/supplier/SupplierLayout';
import {
  Package,
  Plus,
  Search,
  Edit3,
  Loader2,
  X,
} from 'lucide-react';

const CATEGORIES = ['ALL', 'Seeds', 'Fertilizers', 'Pesticides', 'Farm Tools', 'Irrigation Equipment', 'Other'];
const UNITS = ['bag', 'pack', 'kg', 'liter', 'bottle', 'kit', 'unit'];

export default function SupplierProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Seeds',
    price: '',
    unit: 'bag',
    stock: '',
    lowStockThreshold: '10',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'ALL') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/supplier/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Seeds',
      price: '',
      unit: 'bag',
      stock: '',
      lowStockThreshold: '10',
      description: '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      unit: p.unit || 'bag',
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold || 10),
      description: p.description || '',
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const url = editingProduct
        ? `/api/supplier/products/${editingProduct.id}`
        : '/api/supplier/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          unit: productForm.unit,
          stock: Number(productForm.stock),
          lowStockThreshold: Number(productForm.lowStockThreshold),
          description: productForm.description,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setModalOpen(false);
        fetchProducts();
      } else {
        setErrorMsg(resData.error || 'Failed to save product.');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <SupplierLayout
      title="Product Catalog"
      subtitle="Manage farm inputs, high-yield seed varieties, fertilizers and tools."
    >
      <div className="supplier-saas-content">
        {/* Top Header Card */}
        <div className="supplier-card">
          <div className="supplier-card-header">
            <div>
              <h2 className="supplier-card-title">Products Management</h2>
              <p className="supplier-card-subtitle">
                Catalog of farm inputs, seed lots, fertilizers and machinery listed for farmers.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="supplier-btn-primary"
            >
              <Plus size={16} />
              <span>+ Add Product</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product name or specifications..."
                  className="supplier-form-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              <button type="submit" className="supplier-btn-primary" style={{ padding: '0 20px' }}>
                Search
              </button>
            </form>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid',
                    borderColor: category === c ? '#15803d' : '#e2e8f0',
                    backgroundColor: category === c ? '#15803d' : '#ffffff',
                    color: category === c ? '#ffffff' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c === 'ALL' ? 'All Categories' : c}
                </button>
              ))}
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px', color: '#15803d' }} />
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>Loading catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1',
              }}
            >
              <Package size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                No products found
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Try adjusting your search criteria or add a new agricultural item.
              </p>
            </div>
          ) : (
            <div className="supplier-table-container">
              <table className="supplier-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Available Stock</th>
                    <th>Threshold</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
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
                          {p.description && (
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: '#64748b',
                                marginTop: '2px',
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.description}
                            </div>
                          )}
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
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(p.price)}{' '}
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                            /{p.unit || 'bag'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#1e293b' }}>
                          {p.stock} {p.unit || 'units'}
                        </td>
                        <td style={{ color: '#64748b', fontWeight: 600 }}>
                          {p.lowStockThreshold} {p.unit || 'units'}
                        </td>
                        <td>
                          {isOut ? (
                            <span className="supplier-badge out-of-stock">Out of Stock</span>
                          ) : isLow ? (
                            <span className="supplier-badge low-stock">Low Stock</span>
                          ) : (
                            <span className="supplier-badge in-stock">In Stock</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="supplier-btn-secondary"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
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

      {/* Modal: Add or Edit */}
      {modalOpen && (
        <div className="supplier-modal-backdrop">
          <div className="supplier-modal-card">
            <div className="supplier-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={18} />
                </div>
                <h3 className="supplier-modal-title">
                  {editingProduct ? 'Edit Agricultural Product' : 'Add New Agricultural Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  margin: '16px 24px 0',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="supplier-modal-body">
                <div className="supplier-form-group">
                  <label className="supplier-form-label">
                    Product Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Certified Sharbati Wheat Seeds (PBW 550)"
                    className="supplier-form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Category <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="supplier-form-select"
                    >
                      {CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Packaging Unit
                    </label>
                    <select
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="supplier-form-select"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Price (₹) <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="850"
                      className="supplier-form-input"
                    />
                  </div>

                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Stock <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      placeholder="50"
                      className="supplier-form-input"
                    />
                  </div>

                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={productForm.lowStockThreshold}
                      onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
                      placeholder="10"
                      className="supplier-form-input"
                    />
                  </div>
                </div>

                <div className="supplier-form-group">
                  <label className="supplier-form-label">
                    Description &amp; Specifications
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Provide seed variety, chemical composition, or warranty details..."
                    className="supplier-form-textarea"
                  />
                </div>
              </div>

              <div className="supplier-modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="supplier-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="supplier-btn-primary"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SupplierLayout>
  );
}
