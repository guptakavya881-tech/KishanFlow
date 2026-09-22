'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Calendar,
  KeyRound,
  LogOut,
  Building,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function AdminProfilePage() {
  const { user, logout } = useAuth();

  const adminName = user?.fullName || 'System Administrator';
  const adminEmail = user?.email || 'admin@kishanflow.com';
  const adminMobile = user?.mobile || '9999900001';
  const adminLocation = user?.location || 'Central Mandi Headquarters';
  const adminInitial = adminName.charAt(0).toUpperCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Active since platform inception';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Administrator Profile</h1>
            <p className="admin-page-subtitle">
              Authenticated administrative session and access credential details
            </p>
          </div>
        </div>

        {/* Profile Card Hero */}
        <div className="admin-profile-hero-card">
          <div className="admin-profile-hero-left">
            <div className="admin-profile-large-avatar">
              <span>{adminInitial}</span>
            </div>
            <div className="admin-profile-hero-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 className="admin-profile-hero-name">{adminName}</h2>
                <span className="admin-role-tag" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                  Administrator
                </span>
              </div>
              <p className="admin-profile-hero-email">{adminEmail}</p>
              <div className="admin-profile-hero-tags">
                <span className="admin-hero-tag-item">
                  <ShieldCheck size={14} color="#15803d" />
                  Full System Governance
                </span>
                <span className="admin-hero-tag-item">
                  <CheckCircle2 size={14} color="#15803d" />
                  Role-Based Access Verified
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="admin-profile-logout-btn"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Details 2-Column Grid */}
        <div className="admin-two-col-grid">
          {/* Column 1: Account Information */}
          <div className="admin-section-card">
            <div className="admin-section-header">
              <h3 className="admin-section-title" style={{ fontSize: '1.1rem' }}>
                <User size={18} color="#15803d" />
                Account Information
              </h3>
            </div>

            <div className="admin-profile-fields-list">
              <div className="admin-profile-field-row">
                <span className="field-label">Full Name</span>
                <span className="field-val">{adminName}</span>
              </div>

              <div className="admin-profile-field-row">
                <span className="field-label">Email Address</span>
                <span className="field-val">{adminEmail}</span>
              </div>

              <div className="admin-profile-field-row">
                <span className="field-label">Mobile Number</span>
                <span className="field-val">{adminMobile}</span>
              </div>

              <div className="admin-profile-field-row">
                <span className="field-label">Headquarters / Location</span>
                <span className="field-val">{adminLocation}</span>
              </div>

              <div className="admin-profile-field-row">
                <span className="field-label">Account Status</span>
                <span className="admin-status-badge active">Active Verified</span>
              </div>

              <div className="admin-profile-field-row">
                <span className="field-label">Member Since</span>
                <span className="field-val">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Column 2: System Permissions & Security */}
          <div className="admin-section-card">
            <div className="admin-section-header">
              <h3 className="admin-section-title" style={{ fontSize: '1.1rem' }}>
                <ShieldCheck size={18} color="#15803d" />
                Administrative Privileges
              </h3>
            </div>

            <div className="admin-profile-privilege-list">
              <div className="admin-privilege-item">
                <div className="admin-privilege-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="admin-privilege-title">Mandi Oversight &amp; Audit</h4>
                  <p className="admin-privilege-desc">Full visibility over farmer crop listings, mandi centre queues, and procurement weighments.</p>
                </div>
              </div>

              <div className="admin-privilege-item">
                <div className="admin-privilege-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="admin-privilege-title">User &amp; Entity Directory</h4>
                  <p className="admin-privilege-desc">Access to verified Farmer and Buyer directories, status tracking, and order histories.</p>
                </div>
              </div>

              <div className="admin-privilege-item">
                <div className="admin-privilege-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="admin-privilege-title">Financial Settlement Monitoring</h4>
                  <p className="admin-privilege-desc">Tracking of escrow deposits, mandi direct bank transfers (DBT), and transaction logs.</p>
                </div>
              </div>

              <div className="admin-privilege-item">
                <div className="admin-privilege-icon">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="admin-privilege-title">Encrypted Session Security</h4>
                  <p className="admin-privilege-desc">Session validated through secure HTTP-only JWT token with 7-day expiration.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
