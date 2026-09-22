'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { Activity, CheckCircle2, Clock, MapPin, Scale, Loader2, Sparkles } from 'lucide-react';

export default function ProcurementTrackingPage() {
  const [procurement, setProcurement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcurement = async () => {
      try {
        const res = await fetch('/api/farmer/procurement');
        const data = await res.json();
        if (data.success && data.hasProcurement) {
          setProcurement(data);
        } else {
          setProcurement(null);
        }
      } catch (err) {
        console.error('Error fetching procurement tracking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProcurement();
  }, []);

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-4xl mx-auto select-none">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-[#15803d] font-bold text-xs uppercase tracking-wider mb-1">
            <Activity size={16} className="text-[#16a34a]" />
            <span>Procurement Progress Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14532d]">Procurement Status</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Real-time stage tracking from arrival verification to DBT bank settlement.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-emerald-600" />
            <span className="text-xs font-semibold">Loading procurement status...</span>
          </div>
        ) : !procurement ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
              <Activity size={30} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">No procurement in progress.</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                When you book and attend a procurement slot at the mandi, the real-time 8-stage verification, electronic scale weighing, and DBT settlement timeline will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/farmer/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#15803d] text-white font-extrabold text-xs hover:bg-[#166534] transition-colors shadow-2xs"
              >
                <Sparkles size={16} /> Find Best Slot
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Details Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Current Active Procurement
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {procurement.cropName} • {Number(procurement.bookedQuantity).toLocaleString()} {procurement.unit}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-200 flex items-center gap-1.5">
                    <Scale size={14} /> Weighing in progress
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                <div className="p-3 bg-slate-50/80 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Booked Quantity</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                    {procurement.bookedQuantity} {procurement.unit}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Actual Weighed Qty</span>
                  <span className="text-sm font-extrabold text-emerald-800 mt-0.5 block">
                    {procurement.actualQuantity} {procurement.unit}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Procurement Centre</span>
                  <span className="text-sm font-extrabold text-slate-900 truncate block mt-0.5">
                    {procurement.centreName}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-2xl">
                  <span className="text-slate-400 block text-[11px]">Date</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{procurement.date}</span>
                </div>
              </div>
            </div>

            {/* 8-Stage Timeline */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                8-Stage Verification & Settlement Timeline
              </h3>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {(procurement.steps || []).map((s) => {
                  const isCompleted = s.status === 'completed';
                  const isActive = s.status === 'active';

                  return (
                    <div key={s.step} className="relative flex items-start gap-4 text-xs">
                      {/* Step Circle Marker */}
                      <div
                        className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isCompleted
                            ? 'bg-[#15803d] text-white shadow-2xs'
                            : isActive
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}
                      >
                        {isCompleted ? '✓' : s.step}
                      </div>

                      <div className="flex-1 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <h4
                            className={`font-bold text-sm ${
                              isCompleted
                                ? 'text-emerald-900'
                                : isActive
                                ? 'text-amber-900 font-extrabold'
                                : 'text-slate-500'
                            }`}
                          >
                            {s.step}. {s.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">{s.timestamp}</span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isCompleted
                              ? 'bg-[#dcfce7] text-[#166534]'
                              : isActive
                              ? 'bg-amber-200 text-amber-900 uppercase tracking-wider'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isCompleted ? 'Completed' : isActive ? 'Current Stage' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </FarmerLayout>
  );
}
