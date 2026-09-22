'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react';

export default function SettingsModule({ roleTitle = 'Account', roleColor = '#15803d' }) {
  const { user, refreshUser, logout } = useAuth();

  // Profile Form state
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    mobile: '',
    location: '',
    companyName: '',
    businessType: '',
    gstin: '',
    role: '',
    accountStatus: 'Active',
  });

  // Password Form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notifications state (stored in local preference)
  const [notifPrefs, setNotifPrefs] = useState({
    smsAlerts: true,
    emailAlerts: true,
    queueUpdates: true,
    paymentAlerts: true,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        const json = await res.json();
        if (json.success && json.data) {
          const u = json.data;
          setProfile({
            fullName: u.fullName || '',
            email: u.email || '',
            mobile: u.mobile || '',
            location: u.location || '',
            companyName: u.companyName || '',
            businessType: u.businessType || '',
            gstin: u.gstin || '',
            role: (u.role || user?.role || '').toUpperCase(),
            accountStatus: u.accountStatus || 'Active',
          });
        }

        // Load saved notification preferences from localStorage if present
        const savedNotifs = localStorage.getItem(`kflow_notif_prefs_${user?.id || 'default'}`);
        if (savedNotifs) {
          try {
            setNotifPrefs(JSON.parse(savedNotifs));
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleToggleNotif = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (user?.id) {
      localStorage.setItem(`kflow_notif_prefs_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profile.fullName,
          email: profile.email,
          mobile: profile.mobile,
          location: profile.location,
          companyName: profile.companyName,
          businessType: profile.businessType,
          gstin: profile.gstin,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setProfileMsg({ type: 'success', text: 'Profile settings saved successfully!' });
        if (refreshUser) refreshUser();
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 5000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!passwords.currentPassword || !passwords.newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill out all password fields.' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin mb-3 text-emerald-600" size={32} />
        <p className="text-sm font-bold text-slate-700">Loading settings &amp; preferences...</p>
      </div>
    );
  }

  const isBuyerOrSupplier = profile.role === 'BUYER' || profile.role === 'SUPPLIER';

  return (
    <div className="kf-settings-container pb-16">
      {/* 1. Top Banner */}
      <div className="kf-settings-banner">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} />
            <span>KishanFlow Account Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">
            {roleTitle} Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
            Manage your account credentials, notifications, and profile details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Role: {profile.role || 'USER'} (Verified)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{profile.accountStatus}</span>
          </div>
        </div>
      </div>

      {/* 2. Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Profile Form & Password Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Personal & Contact Info */}
          <div className="kf-settings-card">
            <div className="kf-settings-card-header">
              <div className="kf-card-icon-box green">
                <User size={20} />
              </div>
              <div>
                <h2 className="kf-settings-card-title">Personal &amp; Contact Information</h2>
                <p className="kf-settings-card-sub">
                  Your profile details visible on dispatch notes, mandi contracts, and gate tokens.
                </p>
              </div>
            </div>

            {profileMsg.text && (
              <div
                className={`mb-5 p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="kf-form-input"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Assigned Role (Read-only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${profile.role} (Verified APMC User)`}
                    className="kf-form-input"
                  />
                </div>

                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={profile.mobile}
                    onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                    className="kf-form-input"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="kf-form-input"
                    placeholder="e.g. user@kishanflow.com"
                  />
                </div>

                <div className="kf-form-group sm:col-span-2">
                  <label className="kf-form-label">
                    Address / Operating Location
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="kf-form-input"
                    placeholder="e.g. Meerut Mandi, Uttar Pradesh"
                  />
                </div>

                {isBuyerOrSupplier && (
                  <>
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                        <Building size={14} className="text-emerald-600" />
                        Commercial &amp; Entity Information
                      </p>
                    </div>

                    <div className="kf-form-group">
                      <label className="kf-form-label">
                        Company / Trade Name
                      </label>
                      <input
                        type="text"
                        value={profile.companyName}
                        onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                        className="kf-form-input"
                        placeholder="Registered Enterprise Name"
                      />
                    </div>

                    <div className="kf-form-group">
                      <label className="kf-form-label">
                        GSTIN / Tax ID
                      </label>
                      <input
                        type="text"
                        value={profile.gstin}
                        onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                        className="kf-form-input"
                        placeholder="e.g. 09AAACF1234D1Z5"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="kf-btn-primary"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Profile Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section: Security & Password */}
          <div className="kf-settings-card">
            <div className="kf-settings-card-header">
              <div className="kf-card-icon-box amber">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="kf-settings-card-title">Security &amp; Password</h2>
                <p className="kf-settings-card-sub">
                  Update your platform password to protect your account and transactions.
                </p>
              </div>
            </div>

            {passwordMsg.text && (
              <div
                className={`mb-5 p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {passwordMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className="kf-form-input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="kf-form-group">
                  <label className="kf-form-label">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="kf-form-input"
                    placeholder="Min 6 characters"
                  />
                </div>

                <div className="kf-form-group">
                  <label className="kf-form-label">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="kf-form-input"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section: Account Actions & Logout */}
          <div className="kf-settings-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="kf-settings-card-header">
              <div className="kf-card-icon-box red">
                <LogOut size={20} />
              </div>
              <div>
                <h2 className="kf-settings-card-title">Account Actions</h2>
                <p className="kf-settings-card-sub">
                  Safely disconnect your session and sign out of this device.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800 m-0">Sign Out of KishanFlow</p>
                <p className="text-xs text-slate-500 mt-1 m-0">
                  Active sessions and cached tokens on this machine will be cleared.
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="kf-btn-danger"
              >
                <LogOut size={15} />
                <span>Sign Out Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Preferences & Mandi Standards */}
        <div className="space-y-6">
          {/* Notification Preferences Card */}
          <div className="kf-settings-card space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
              <Bell size={18} className="text-emerald-600" />
              <span>Notification Preferences</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed m-0">
              Control which operational notifications you receive across SMS, email, and live app alerts.
            </p>

            <div className="space-y-3 pt-2">
              <div
                onClick={() => handleToggleNotif('smsAlerts')}
                className="kf-toggle-item"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 m-0">SMS Gate Alerts</p>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">Alerts when your token is called</p>
                </div>
                <div className={`kf-switch ${notifPrefs.smsAlerts ? 'active' : ''}`}>
                  <div className="kf-switch-knob" />
                </div>
              </div>

              <div
                onClick={() => handleToggleNotif('emailAlerts')}
                className="kf-toggle-item"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 m-0">Email Order Updates</p>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">Invoices &amp; contract slips</p>
                </div>
                <div className={`kf-switch ${notifPrefs.emailAlerts ? 'active' : ''}`}>
                  <div className="kf-switch-knob" />
                </div>
              </div>

              <div
                onClick={() => handleToggleNotif('paymentAlerts')}
                className="kf-toggle-item"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 m-0">Payment Settlement</p>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">Real-time DBT bank notifications</p>
                </div>
                <div className={`kf-switch ${notifPrefs.paymentAlerts ? 'active' : ''}`}>
                  <div className="kf-switch-knob" />
                </div>
              </div>

              <div
                onClick={() => handleToggleNotif('queueUpdates')}
                className="kf-toggle-item"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 m-0">Queue Progress Updates</p>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">Weighbridge turnaround warnings</p>
                </div>
                <div className={`kf-switch ${notifPrefs.queueUpdates ? 'active' : ''}`}>
                  <div className="kf-switch-knob" />
                </div>
              </div>
            </div>
          </div>

          {/* Mandi Standards Card */}
          <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Mandi Compliance &amp; Trust</span>
            </div>
            <h3 className="text-base font-extrabold text-white m-0">Direct Beneficiary Account</h3>
            <p className="text-xs text-emerald-100 leading-relaxed m-0">
              Your profile is verified with regional APMC mandi samitis. All payments are transferred directly to your DBT registered bank account without middlemen commissions.
            </p>
            <div className="pt-2">
              <div className="inline-block px-3 py-1.5 rounded-lg bg-emerald-800/80 text-[11px] font-semibold text-emerald-200">
                Encrypted with 256-Bit SSL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
