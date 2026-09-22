'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { ArrowLeft, AlertTriangle, Save, CalendarCheck, Loader2 } from 'lucide-react';

export default function EditCropPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const cropId = resolvedParams.id;

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    harvestStatus: 'Ready for Procurement',
    expectedHarvestDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCrop = async () => {
      try {
        const res = await fetch(`/api/farmer/crops/${cropId}`);
        const data = await res.json();
        if (data.success && data.crop) {
          setCrop(data.crop);
          setFormData({
            name: data.crop.name,
            quantity: data.crop.quantity,
            unit: data.crop.unit,
            harvestStatus: data.crop.harvestStatus,
            expectedHarvestDate: data.crop.expectedHarvestDate || '',
            notes: data.crop.notes || '',
          });
        }
      } catch (err) {
        console.error('Error fetching crop:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrop();
  }, [cropId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (crop?.hasActiveBooking) return; // Prevent silent modification

    const numQty = Number(formData.quantity);
    if (!formData.quantity || isNaN(numQty) || numQty <= 0) {
      setErrors({ quantity: 'Quantity must be greater than 0.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/farmer/crops/${cropId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          quantity: numQty,
          unit: formData.unit,
          harvestStatus: formData.harvestStatus,
          expectedHarvestDate: formData.expectedHarvestDate || null,
          notes: formData.notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/farmer/crops');
      } else {
        setErrors({ server: data.error || 'Failed to update crop.' });
      }
    } catch (err) {
      setErrors({ server: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FarmerLayout>
        <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin text-emerald-600" />
          <span>Loading crop details...</span>
        </div>
      </FarmerLayout>
    );
  }

  if (!crop) {
    return (
      <FarmerLayout>
        <div className="p-8 text-center text-slate-500 space-y-3">
          <p className="font-bold">Crop not found.</p>
          <Link href="/farmer/crops" className="text-xs text-emerald-700 font-bold underline">
            Back to My Crops
          </Link>
        </div>
      </FarmerLayout>
    );
  }

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-2xl mx-auto select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/farmer/crops"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#14532d]">Edit Crop — {crop.name}</h1>
            <p className="text-slate-600 text-xs mt-0.5">Update crop quantity or harvest status.</p>
          </div>
        </div>

        {/* Active Booking Guard Notice */}
        {crop.hasActiveBooking ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Active Booking Warning</h3>
                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                  This crop has an active procurement booking. You cannot alter this crop until the active booking is fulfilled or cancelled.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/farmer/bookings"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                <CalendarCheck size={14} /> Review Bookings
              </Link>
              <Link
                href="/farmer/crops"
                className="px-3.5 py-1.5 rounded-xl border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100/50"
              >
                Back to Crops
              </Link>
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs">
          {errors.server && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errors.server}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Crop Name</label>
              <input
                type="text"
                disabled
                value={formData.name}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-semibold text-xs cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  disabled={crop.hasActiveBooking}
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({ ...formData, quantity: e.target.value });
                    if (errors.quantity) setErrors({ ...errors, quantity: '' });
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    crop.hasActiveBooking
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-900'
                  }`}
                />
                {errors.quantity && <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit</label>
                <select
                  disabled={crop.hasActiveBooking}
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    crop.hasActiveBooking
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'border-slate-300 focus:outline-none focus:border-emerald-600 bg-white'
                  }`}
                >
                  <option value="kg">kg</option>
                  <option value="quintal">quintal</option>
                  <option value="tonne">tonne</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Harvest Status</label>
                <select
                  disabled={crop.hasActiveBooking}
                  value={formData.harvestStatus}
                  onChange={(e) => setFormData({ ...formData, harvestStatus: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    crop.hasActiveBooking
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'border-slate-300 focus:outline-none focus:border-emerald-600 bg-white'
                  }`}
                >
                  <option value="Ready for Procurement">Ready for Procurement</option>
                  <option value="Nearly Ready">Nearly Ready</option>
                  <option value="Growing">Growing</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expected Harvest Date
                </label>
                <input
                  type="date"
                  disabled={crop.hasActiveBooking}
                  value={formData.expectedHarvestDate}
                  onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                    crop.hasActiveBooking
                      ? 'bg-slate-50 border-slate-200 text-slate-500'
                      : 'border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Notes</label>
              <textarea
                rows="3"
                disabled={crop.hasActiveBooking}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold ${
                  crop.hasActiveBooking
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-900'
                }`}
              />
            </div>

            {!crop.hasActiveBooking && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                  href="/farmer/crops"
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#15803d] text-white font-extrabold text-xs hover:bg-[#166534] transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </FarmerLayout>
  );
}
