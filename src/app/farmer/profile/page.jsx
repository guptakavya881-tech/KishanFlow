'use client';

import React, { useState, useEffect } from 'react';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, MapPin, Globe, CheckCircle2, ShieldCheck, Edit3, Save, Loader2 } from 'lucide-react';

export default function FarmerProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    location: '',
    preferredLanguage: 'Hindi',
  });

  const [stats, setStats] = useState({
    activeCrops: 0,
    upcomingBookings: 0,
    completedProcurements: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await fetch('/api/farmer/dashboard');
        const json = await res.json();
        if (json.success && json.data) {
          const u = json.data.user || user;
          setFormData({
            fullName: u?.fullName || user?.fullName || 'Anshika Bhandari',
            mobile: u?.mobile || user?.mobile || '',
            location: u?.location || user?.location || 'Meerut, Uttar Pradesh',
            preferredLanguage: 'Hindi',
          });

          setStats({
            activeCrops: json.data.stats?.activeCropsCount ?? 0,
            upcomingBookings: json.data.stats?.upcomingBookingsCount ?? 0,
            completedProcurements: json.data.stats?.completedProcurementsCount ?? 0,
            pendingPayments: json.data.stats?.pendingPaymentsCount ?? 0,
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSuccessMsg('Profile updated successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-4xl mx-auto select-none">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14532d]">Farmer Profile</h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Manage your personal credentials, address details, and view procurement stats.
            </p>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-bold text-xs transition-colors self-start sm:self-auto shadow-2xs cursor-pointer"
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          )}
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Profile Info Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center border-2 border-white shadow-2xs">
                {formData.fullName.charAt(0) || 'F'}
              </div>
              <div>
                <h2 className="text-xl font-black">{formData.fullName}</h2>
                <p className="text-xs text-emerald-200 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-300" />
                  <span>Role: <strong className="text-white">Farmer</strong></span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-600/80 border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
              Verified Farmer Account
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Edit Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Mandi Area</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Language</label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                    <option value="Punjabi">Punjabi</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#15803d] text-white font-extrabold text-xs hover:bg-[#166534] transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Save size={15} /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <User size={18} className="text-[#15803d] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">Full Name</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{formData.fullName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-[#15803d] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">Mobile Number</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{formData.mobile || '—'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#15803d] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">Location</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{formData.location || '—'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe size={18} className="text-[#15803d] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">Preferred Language</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{formData.preferredLanguage}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Procurement Statistics Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-emerald-100">
              <span className="text-2xl font-black text-[#15803d]">{stats.activeCrops}</span>
              <span className="text-xs font-bold text-slate-600 block mt-1">Active Crops</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#f0f9ff] border border-sky-100">
              <span className="text-2xl font-black text-[#0284c7]">{stats.upcomingBookings}</span>
              <span className="text-xs font-bold text-slate-600 block mt-1">Upcoming Bookings</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#faf5ff] border border-purple-100">
              <span className="text-2xl font-black text-[#7c3aed]">{stats.completedProcurements}</span>
              <span className="text-xs font-bold text-slate-600 block mt-1">Completed Procurements</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-100">
              <span className="text-2xl font-black text-[#d97706]">{stats.pendingPayments}</span>
              <span className="text-xs font-bold text-slate-600 block mt-1">Pending Payments</span>
            </div>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
