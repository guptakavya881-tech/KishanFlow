'use client';

import React, { useState, useEffect } from 'react';
import SupplierLayout from '@/components/supplier/SupplierLayout';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  KeyRound,
  ShieldCheck,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Building,
  LogOut,
  Truck,
  Check,
} from 'lucide-react';

export default function SupplierSettingsPage() {
  const { user, refreshUser, logout } = useAuth();

  // Profile Form state
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    mobile: '',
    location: '',
    companyName: '',
    businessType: 'Agricultural Inputs & Farm Equipment Supplier',
    gstin: '',
    accountStatus: 'Active',
  });

  // Password Form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notifications state (saved locally in localStorage)
  const [notifPrefs, setNotifPrefs] = useState({
    orderAlerts: true,
    lowStockAlerts: true,
    fulfillmentAlerts: true,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [notifSavedMsg, setNotifSavedMsg] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        const json = await res.json();
        if (json.success && json.data) {
          setProfile({
            fullName: json.data.fullName || '',
            email: json.data.email || '',
            mobile: json.data.mobile || '',
            location: json.data.location || '',
            companyName: json.data.companyName || json.data.fullName || '',
            businessType: json.data.businessType || 'Agricultural Inputs & Farm Equipment Supplier',
            gstin: json.data.gstin || '',
            accountStatus: json.data.accountStatus || 'Active',
          });
        }

        // Load saved notification preferences
        const savedNotifs = localStorage.getItem('kflow_supplier_notif_prefs');
        if (savedNotifs) {
          try {
            setNotifPrefs(JSON.parse(savedNotifs));
          } catch {}
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profile.fullName.trim(),
          mobile: profile.mobile.trim(),
          email: profile.email.trim(),
          location: profile.location.trim(),
          companyName: profile.companyName.trim(),
          businessType: profile.businessType.trim(),
          gstin: profile.gstin.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setProfileMsg({ type: 'success', text: 'Supplier profile updated successfully!' });
        if (refreshUser) refreshUser();
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error while updating profile.' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 5000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwords.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordMsg({ type: '', text: '' }), 5000);
    }
  };

  const handleToggleNotif = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('kflow_supplier_notif_prefs', JSON.stringify(updated));
    setNotifSavedMsg(true);
    setTimeout(() => setNotifSavedMsg(false), 2500);
  };

  return (
    <SupplierLayout
      title="Supplier Settings"
      subtitle="Configure profile credentials, business contact, and notification preferences."
    >
      <div className="supplier-saas-content">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#15803d' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Loading supplier configuration...</p>
          </div>
        ) : (
          <div className="supplier-settings-grid">
            {/* Left 2 Columns: Profile & Password Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Profile Card */}
              <div className="supplier-card">
                <div className="supplier-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <Building size={20} />
                    </div>
                    <div>
                      <h2 className="supplier-card-title">Business &amp; Profile Information</h2>
                      <p className="supplier-card-subtitle">
                        Supplier contact credentials displayed on farmer dispatch orders.
                      </p>
                    </div>
                  </div>
                </div>

                {profileMsg.text && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: profileMsg.type === 'error' ? '#fee2e2' : '#dcfce7',
                      border: '1px solid',
                      borderColor: profileMsg.type === 'error' ? '#fecaca' : '#bbf7d0',
                      color: profileMsg.type === 'error' ? '#b91c1c' : '#15803d',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {profileMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        Company / Entity Name <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={profile.companyName}
                        onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                        placeholder="e.g. AgriSupply Logistics Co."
                        className="supplier-form-input"
                      />
                    </div>

                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        Authorized Representative Name <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Chandra"
                        className="supplier-form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        Email Address <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="supplier-form-input"
                      />
                    </div>

                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        Mobile Phone <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={profile.mobile}
                        onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                        className="supplier-form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        Warehouse / Hub Address
                      </label>
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="e.g. Agri-Logistics Hub, Warehouse 4, Meerut"
                        className="supplier-form-input"
                      />
                    </div>

                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        GSTIN / Tax ID
                      </label>
                      <input
                        type="text"
                        value={profile.gstin}
                        onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                        placeholder="e.g. 09AAACB2345K1Z2"
                        className="supplier-form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="supplier-btn-primary"
                    >
                      {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Password & Security Card */}
              <div className="supplier-card">
                <div className="supplier-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Lock size={19} />
                    </div>
                    <div>
                      <h2 className="supplier-card-title">Security &amp; Password</h2>
                      <p className="supplier-card-subtitle">
                        Update your authentication password credentials.
                      </p>
                    </div>
                  </div>
                </div>

                {passwordMsg.text && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: passwordMsg.type === 'error' ? '#fee2e2' : '#dcfce7',
                      border: '1px solid',
                      borderColor: passwordMsg.type === 'error' ? '#fecaca' : '#bbf7d0',
                      color: passwordMsg.type === 'error' ? '#b91c1c' : '#15803d',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {passwordMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="supplier-form-group">
                    <label className="supplier-form-label">
                      Current Password <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="supplier-form-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        New Password <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="supplier-form-input"
                      />
                    </div>

                    <div className="supplier-form-group">
                      <label className="supplier-form-label">
                        Confirm New Password <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="supplier-form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="supplier-btn-secondary"
                      style={{ borderColor: '#d97706', color: '#b45309' }}
                    >
                      {savingPassword ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right 1 Column: Role Details & Notification Preferences */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Account Status Badge Card */}
              <div className="supplier-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Authorization Status
                    </span>
                    <h3 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                      Verified Direct Supplier
                    </h3>
                  </div>
                </div>

                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                  Your supplier account is authenticated for agricultural input catalog listing, inventory management, and farmer order fulfillment.
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Status:</span>
                  <span className="supplier-badge in-stock">Active &amp; Compliant</span>
                </div>
              </div>

              {/* Notification Preferences Card */}
              <div className="supplier-card">
                <div className="supplier-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={18} style={{ color: '#15803d' }} />
                    <h3 className="supplier-card-title" style={{ fontSize: '1rem' }}>
                      Notification Alerts
                    </h3>
                  </div>
                  {notifSavedMsg && (
                    <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={13} /> Saved
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="supplier-toggle-row">
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                        Farmer Order Alerts
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                        Immediate notification on new input orders.
                      </p>
                    </div>
                    <label className="supplier-toggle">
                      <input
                        type="checkbox"
                        checked={notifPrefs.orderAlerts}
                        onChange={() => handleToggleNotif('orderAlerts')}
                      />
                      <span className="supplier-toggle-slider" />
                    </label>
                  </div>

                  <div className="supplier-toggle-row">
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                        Low Stock Alerts
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                        Alerts when inventory falls below minimums.
                      </p>
                    </div>
                    <label className="supplier-toggle">
                      <input
                        type="checkbox"
                        checked={notifPrefs.lowStockAlerts}
                        onChange={() => handleToggleNotif('lowStockAlerts')}
                      />
                      <span className="supplier-toggle-slider" />
                    </label>
                  </div>

                  <div className="supplier-toggle-row">
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                        Fulfillment Confirmations
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                        Confirmation upon final farmer delivery.
                      </p>
                    </div>
                    <label className="supplier-toggle">
                      <input
                        type="checkbox"
                        checked={notifPrefs.fulfillmentAlerts}
                        onChange={() => handleToggleNotif('fulfillmentAlerts')}
                      />
                      <span className="supplier-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Sign Out Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991b1b', display: 'block' }}>
                    Session Security
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
                    Terminate current supplier session
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="supplier-btn-secondary"
                  style={{ borderColor: '#f87171', color: '#dc2626', padding: '6px 12px' }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupplierLayout>
  );
}
