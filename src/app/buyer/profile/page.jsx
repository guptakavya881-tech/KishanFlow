'use client';

import React, { useState, useEffect } from 'react';
import BuyerLayout from '@/components/buyer/BuyerLayout';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  ShieldCheck,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  TrendingUp,
  CreditCard,
  Layers,
} from 'lucide-react';

export default function BuyerProfilePage() {
  const { user, refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    cancelledOrders: 0,
    totalVolumeProcured: 0,
    totalSpent: 0,
  });

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    mobile: '',
    location: '',
    businessType: '',
    gstin: '',
  });

  const [errors, setErrors] = useState({});

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/buyer/profile');
      const data = await res.json();

      if (data.success && data.data) {
        const u = data.data.user;
        setProfileData(u);
        setStats(data.data.stats || {});
        setFormData({
          fullName: u.fullName || '',
          companyName: u.companyName || '',
          email: u.email || '',
          mobile: u.mobile || '',
          location: u.location || '',
          businessType: u.businessType || '',
          gstin: u.gstin || '',
        });
      } else {
        setErrorMsg(data.error || 'Failed to load profile data.');
      }
    } catch (err) {
      console.error('Error loading buyer profile:', err);
      setErrorMsg('Failed to load profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name is required (minimum 2 characters).';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (formData.mobile.trim()) {
      const digitsOnly = formData.mobile.trim().replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      setErrorMsg('');

      const res = await fetch('/api/buyer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setProfileData(data.data.user);
        setStats(data.data.stats || {});
        setIsEditing(false);
        setSuccessMsg('Profile updated successfully.');

        // Refresh global AuthContext to update BuyerHeader and other components
        if (refreshUser) {
          await refreshUser();
        }

        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg('Network error while saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        fullName: profileData.fullName || '',
        companyName: profileData.companyName || '',
        email: profileData.email || '',
        mobile: profileData.mobile || '',
        location: profileData.location || '',
        businessType: profileData.businessType || '',
        gstin: profileData.gstin || '',
      });
    }
    setErrors({});
    setErrorMsg('');
    setIsEditing(false);
  };

  const buyerInitial = (profileData?.companyName || profileData?.fullName || 'B').charAt(0).toUpperCase();

  const formattedRegDate = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Registered Account';

  return (
    <BuyerLayout>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Header Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>
              Buyer Profile
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#6b7280' }}>
              Manage your company details, authorized contact credentials, and delivery warehouse addresses.
            </p>
          </div>

          {!isEditing && !loading && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)',
                transition: 'all 0.18s ease',
              }}
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            color: '#166534',
            fontSize: '0.86rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: '#fef2f2',
            border: '1.5px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.86rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <AlertCircle size={18} style={{ color: '#dc2626' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #e5e7eb',
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <Loader2 size={32} className="animate-spin text-emerald-600" />
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280', fontWeight: 600 }}>
              Loading profile information...
            </p>
          </div>
        ) : (
          <>
            {/* 1. Profile Hero Card */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1.5px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)',
            }}>
              {/* Header Gradient Strip */}
              <div style={{
                background: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14532d 100%)',
                padding: '28px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  {/* Large Avatar */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    backgroundColor: '#dcfce7',
                    color: '#14532d',
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    flexShrink: 0,
                  }}>
                    {buyerInitial}
                  </div>

                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900 }}>
                      {profileData?.companyName || profileData?.fullName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        backgroundColor: '#dcfce7',
                        color: '#14532d',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}>
                        {profileData?.buyerId || 'KF-BUYER'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#bbf7d0', fontWeight: 600 }}>
                        {profileData?.businessType || 'Institutional Buyer'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <ShieldCheck size={15} style={{ color: '#86efac' }} />
                    <span>Verified Buyer Account</span>
                  </span>
                </div>
              </div>

              {/* Profile Details (View or Edit Mode) */}
              {isEditing ? (
                <form onSubmit={handleSave} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Edit Buyer Information
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>* Required fields</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                    {/* Full Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Representative Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: errors.fullName ? '1.5px solid #dc2626' : '1.5px solid #d1d5db',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      {errors.fullName && (
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                          {errors.fullName}
                        </span>
                      )}
                    </div>

                    {/* Company Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Business / Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g. Apex Agri Procurement Ltd"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #d1d5db',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Official Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: errors.email ? '1.5px solid #dc2626' : '1.5px solid #d1d5db',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      {errors.email && (
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                          {errors.email}
                        </span>
                      )}
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Mobile Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: errors.mobile ? '1.5px solid #dc2626' : '1.5px solid #d1d5db',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      {errors.mobile && (
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                          {errors.mobile}
                        </span>
                      )}
                    </div>

                    {/* Location / Mandi Warehouse */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Location / Delivery Warehouse Hub
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Navi Mumbai Mandi Hub, Sector 19"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #d1d5db',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#374151', marginBottom: '6px' }}>
                        Procurement Category / Business Type
                      </label>
                      <input
                        type="text"
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        placeholder="e.g. Grain Processing Mill, Exporter"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #d1d5db',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f3f4f6',
                  }}>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '1.5px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#4b5563',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        backgroundColor: '#15803d',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)',
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Read-Only Grid View */
                <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
                  {/* Basic & Contact Information */}
                  <div>
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Buyer Identification &amp; Contact Credentials
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <User size={18} style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                            Authorized Representative
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                            {profileData?.fullName || '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <Building2 size={18} style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                            Company / Entity Name
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                            {profileData?.companyName || profileData?.fullName || '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <Mail size={18} style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                            Email Address
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                            {profileData?.email || '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <Phone size={18} style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                            Mobile Phone Number
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                            {profileData?.mobile ? `+91 ${profileData.mobile}` : '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <MapPin size={18} style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                            Warehouse / Mandi Delivery Area
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                            {profileData?.location || '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <Calendar size={18} style={{ color: '#15803d', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block' }}>
                            Registration Date
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginTop: '2px', display: 'block' }}>
                            {formattedRegDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information (Protected) */}
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Account Security &amp; Identity
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, display: 'block' }}>
                          System Buyer ID (Protected)
                        </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#111827', marginTop: '2px', display: 'block' }}>
                          {profileData?.buyerId}
                        </span>
                      </div>

                      <div style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, display: 'block' }}>
                          Account Role
                        </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#15803d', marginTop: '2px', display: 'block' }}>
                          Buyer (Institutional)
                        </span>
                      </div>

                      <div style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, display: 'block' }}>
                          Account Status
                        </span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#16a34a', marginTop: '2px', display: 'block' }}>
                          {profileData?.accountStatus || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Real Procurement Statistics Overview */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1.5px solid #e5e7eb',
              padding: '24px 28px',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)',
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.82rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Procurement Statistics Overview
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '18px',
                  padding: '18px',
                  border: '1.5px solid #bbf7d0',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#15803d', display: 'block' }}>
                    {stats.totalOrders}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', marginTop: '4px', display: 'block' }}>
                    Total Orders Placed
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#f0f9ff',
                  borderRadius: '18px',
                  padding: '18px',
                  border: '1.5px solid #bae6fd',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', display: 'block' }}>
                    {stats.activeOrders}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', marginTop: '4px', display: 'block' }}>
                    Active Procurements
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#faf5ff',
                  borderRadius: '18px',
                  padding: '18px',
                  border: '1.5px solid #e9d5ff',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7c3aed', display: 'block' }}>
                    {stats.completedOrders}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b21a8', marginTop: '4px', display: 'block' }}>
                    Completed Purchases
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#fffbeb',
                  borderRadius: '18px',
                  padding: '18px',
                  border: '1.5px solid #fde68a',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#d97706', display: 'block' }}>
                    {stats.totalVolumeProcured > 0 ? `${stats.totalVolumeProcured.toLocaleString('en-IN')} kg` : '0 kg'}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', marginTop: '4px', display: 'block' }}>
                    Total Volume Procured
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </BuyerLayout>
  );
}
