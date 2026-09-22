'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { farmerService } from '@/services/farmerService';
import { ArrowLeft, Clock, Calendar, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';

export default function ChangeSlotPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const [booking, setBooking] = useState(null);
  const [selectedDate, setSelectedDate] = useState('19 September 2026');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM – 10:30 AM');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const b = farmerService.getBookingById(bookingId);
    if (b) {
      setBooking(b);
      setSelectedDate(b.date);
      setSelectedTimeSlot(b.timeSlot);
    }
  }, [bookingId]);

  const handleConfirmChange = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      farmerService.changeBookingSlot(bookingId, selectedDate, selectedTimeSlot);
      router.push('/farmer/bookings');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reschedule slot.');
      setSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <FarmerLayout>
        <div className="p-8 text-center text-slate-500">Loading booking details...</div>
      </FarmerLayout>
    );
  }

  if (booking.status !== 'Confirmed') {
    return (
      <FarmerLayout>
        <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-red-200 text-center space-y-4">
          <AlertTriangle size={32} className="text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Rescheduling Restricted</h2>
          <p className="text-xs text-slate-600">
            This booking is marked as <strong>{booking.status}</strong>. Only active upcoming bookings can be rescheduled.
          </p>
          <Link
            href="/farmer/bookings"
            className="inline-block px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl text-slate-700"
          >
            Back to My Bookings
          </Link>
        </div>
      </FarmerLayout>
    );
  }

  const availableSlotsList = [
    { time: '09:00 AM – 09:30 AM', crowd: 'Medium', wait: 28 },
    { time: '10:00 AM – 10:30 AM', crowd: 'Low', wait: 20 },
    { time: '11:30 AM – 12:00 PM', crowd: 'Low', wait: 18 },
    { time: '01:00 PM – 01:30 PM', crowd: 'High', wait: 40 },
    { time: '03:00 PM – 03:30 PM', crowd: 'Medium', wait: 25 },
  ];

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/farmer/bookings"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Change Procurement Slot</h1>
            <p className="text-slate-600 text-xs mt-0.5">
              Reschedule your time slot for Token {booking.tokenNumber}.
            </p>
          </div>
        </div>

        {/* Current Booking Summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-emerald-950">
          <p className="font-bold text-emerald-900">Current Scheduled Slot:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-emerald-700 block">Crop & Qty:</span>
              <span className="font-bold">{booking.cropName} ({booking.quantity} {booking.unit})</span>
            </div>
            <div>
              <span className="text-emerald-700 block">Current Date & Time:</span>
              <span className="font-bold">{booking.date} • {booking.timeSlot}</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Selection Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select New Procurement Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white"
            >
              <option value="18 September 2026">18 September 2026 (Today)</option>
              <option value="19 September 2026">19 September 2026 (Tomorrow)</option>
              <option value="20 September 2026">20 September 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Available Time Slot
            </label>
            <div className="space-y-2">
              {availableSlotsList.map((slot) => {
                const isSelected = selectedTimeSlot === slot.time;
                return (
                  <div
                    key={slot.time}
                    onClick={() => setSelectedTimeSlot(slot.time)}
                    className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-2 border-emerald-600'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <Clock size={16} className={isSelected ? 'text-emerald-700' : 'text-slate-400'} />
                      <span className="font-bold text-slate-900">{slot.time}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 text-[11px]">Est. Wait: ~{slot.wait}m</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          slot.crowd === 'Low' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {slot.crowd}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/farmer/bookings"
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              onClick={handleConfirmChange}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save size={16} /> Confirm Slot Update
            </button>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
