'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { useAuth } from '@/context/AuthContext';
import WheatLogo from '@/components/WheatLogo';
import { Ticket, Calendar, Clock, MapPin, Sprout, ArrowLeft, Users, CheckCircle2, Loader2 } from 'lucide-react';

// Reusable SVG QR Code Generator Component
function SimpleQRCode({ text, size = 160 }) {
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const grid = 15;
  const hash = hashString(text || 'KF-247');
  const cells = [];

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const isTopLeft = r < 5 && c < 5;
      const isTopRight = r < 5 && c >= grid - 5;
      const isBottomLeft = r >= grid - 5 && c < 5;

      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isTopLeft ? r : isTopRight ? r : r - (grid - 5);
        const localC = isTopLeft ? c : isTopRight ? c - (grid - 5) : c;
        const isBorder = localR === 0 || localR === 4 || localC === 0 || localC === 4;
        const isCenter = localR === 2 && localC === 2;
        if (isBorder || isCenter) cells.push({ r, c });
      } else {
        const val = (hash * (r + 1) * (c + 1) + r * 7 + c * 13) % 100;
        if (val < 45) cells.push({ r, c });
      }
    }
  }

  const cellSize = size / grid;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-white p-2 shadow-xs">
      <rect width={size} height={size} fill="white" />
      {cells.map((cell, idx) => (
        <rect
          key={idx}
          x={cell.c * cellSize}
          y={cell.r * cellSize}
          width={cellSize}
          height={cellSize}
          fill="#15803d"
        />
      ))}
    </svg>
  );
}

export default function DigitalTokenPage({ params }) {
  const { user } = useAuth();
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/farmer/bookings/${bookingId}`);
        const data = await res.json();
        if (data.success && data.booking) {
          setBooking(data.booking);
        }
      } catch (err) {
        console.error('Error fetching booking token:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <FarmerLayout>
        <div className="p-16 text-center text-slate-500 flex items-center justify-center gap-2">
          <Loader2 size={20} className="animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading digital token pass...</span>
        </div>
      </FarmerLayout>
    );
  }

  if (!booking) {
    return (
      <FarmerLayout>
        <div className="p-12 text-center text-slate-500 space-y-3">
          <p className="font-bold text-slate-800">Booking pass not found.</p>
          <Link href="/farmer/bookings" className="text-xs text-emerald-700 font-bold underline">
            Back to Bookings
          </Link>
        </div>
      </FarmerLayout>
    );
  }

  const farmerName = user?.fullName || 'Anshika Bhandari';

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-xl mx-auto select-none">
        {/* Navigation top */}
        <div className="flex items-center gap-3">
          <Link
            href="/farmer/bookings"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#14532d]">Digital Procurement Token</h1>
            <p className="text-slate-600 text-xs mt-0.5">Show this token QR code at the mandi gate.</p>
          </div>
        </div>

        {/* Digital Ticket Layout */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-6 text-center space-y-2 relative">
            <div className="flex justify-center mb-1">
              <WheatLogo size={40} showText={false} href={null} />
            </div>
            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest">
              KishanFlow Mandi Token
            </p>
            <div className="text-3xl font-black font-mono tracking-wider text-amber-300">
              {booking.tokenNumber}
            </div>
            <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700 text-emerald-100 border border-emerald-500/40">
              Status: {booking.status}
            </span>
          </div>

          {/* Ticket Body with QR Code */}
          <div className="p-6 space-y-6 bg-slate-50/50">
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <SimpleQRCode text={`${booking.bookingNumber}-${booking.tokenNumber}`} size={170} />
              <p className="text-[11px] font-mono font-bold text-slate-500 mt-2">
                Booking ID: {booking.bookingNumber}
              </p>
            </div>

            {/* Ticket Details List */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Farmer Name:</span>
                <span className="font-extrabold text-slate-900">{farmerName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Crop & Quantity:</span>
                <span className="font-extrabold text-slate-900">
                  {booking.cropName} • {Number(booking.quantity).toLocaleString()} {booking.unit}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Procurement Centre:</span>
                <span className="font-extrabold text-slate-900 text-right">{booking.centreName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-extrabold text-slate-900">{booking.date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Time Slot:</span>
                <span className="font-extrabold text-[#15803d]">{booking.timeSlot}</span>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 size={16} /> Instructions:
              </p>
              <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 pl-1">
                <li>Show this QR code at the procurement centre entrance counter.</li>
                <li>Please arrive 10–15 minutes before your scheduled slot.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/farmer/queue"
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Users size={16} /> View Live Queue
              </Link>
              <Link
                href="/farmer/dashboard"
                className="w-full sm:flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
