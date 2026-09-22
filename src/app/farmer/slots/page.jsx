'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { farmerService } from '@/services/farmerService';
import { MapPin, Clock, Users, ArrowLeft, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';

function SlotsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const centreId = searchParams.get('centreId') || 'centre-1';
  const cropId = searchParams.get('cropId');
  const qty = searchParams.get('qty') || '1200';
  const unit = searchParams.get('unit') || 'kg';

  const [centre, setCentre] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [crop, setCrop] = useState(null);

  useEffect(() => {
    const c = farmerService.getCentreById(centreId);
    setCentre(c);

    const sList = farmerService.getAvailableSlots(centreId);
    setSlots(sList);
    // Preselect recommended slot if exists
    const rec = sList.find((s) => s.isRecommended) || sList[0];
    setSelectedSlot(rec);

    if (cropId) {
      const cr = farmerService.getCropById(cropId);
      setCrop(cr);
    } else {
      const crops = farmerService.getCrops();
      setCrop(crops[0] || null);
    }
  }, [centreId, cropId]);

  const handleProceedToBooking = () => {
    if (!selectedSlot) return;
    const cropName = crop ? crop.name : 'Wheat';
    const cId = crop ? crop.id : 'crop-1';

    router.push(
      `/farmer/booking/confirm?centreId=${centreId}&cropId=${cId}&cropName=${encodeURIComponent(
        cropName
      )}&qty=${qty}&unit=${unit}&slotId=${selectedSlot.id}&timeSlot=${encodeURIComponent(
        selectedSlot.time
      )}&date=${encodeURIComponent('18 September 2026')}`
    );
  };

  if (!centre) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/farmer/recommendation"
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Select Available Time Slot</h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Choose your preferred time slot for procurement at {centre.name}.
          </p>
        </div>
      </div>

      {/* Centre Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{centre.name}</h2>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {centre.distanceKm} km away
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin size={14} className="text-emerald-600" />
            <span>{centre.address}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block">Current Queue</span>
            <span className="text-sm font-bold text-slate-900">16 farmers</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block">Today's Capacity</span>
            <span className="text-sm font-bold text-slate-900">{centre.todayCapacityPercent}% filled</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block">Est. Waiting Time</span>
            <span className="text-sm font-bold text-slate-900">~{centre.estimatedWaitMins} mins</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-emerald-800 block font-semibold">Selected Crop</span>
            <span className="text-sm font-bold text-emerald-950 truncate block">
              {crop ? crop.name : 'Wheat'} ({qty} {unit})
            </span>
          </div>
        </div>
      </div>

      {/* Slots List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          Available Procurement Slots (18 September 2026)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            return (
              <div
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-emerald-50/80 border-2 border-emerald-600 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock size={16} className={isSelected ? 'text-emerald-700' : 'text-slate-400'} />
                      {slot.time}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Est. Wait: <strong>~{slot.estimatedWait} min</strong>
                    </p>
                  </div>

                  {slot.isRecommended && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900 flex items-center gap-1">
                      <Sparkles size={11} /> AI Preferred
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 text-xs">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      slot.crowdLevel === 'Low'
                        ? 'bg-emerald-100 text-emerald-800'
                        : slot.crowdLevel === 'Medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {slot.crowdLevel} Crowd
                  </span>

                  <button
                    type="button"
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    {isSelected ? 'Selected ✓' : 'Select Slot'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation CTA Footer */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 block">Selected Time Slot:</span>
          <span className="text-sm font-bold text-slate-900">
            {selectedSlot ? selectedSlot.time : 'None selected'}
          </span>
        </div>

        <button
          onClick={handleProceedToBooking}
          disabled={!selectedSlot}
          className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs"
        >
          <span>Continue to Confirmation</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function SlotsPage() {
  return (
    <FarmerLayout>
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading available slots...</div>}>
        <SlotsContent />
      </Suspense>
    </FarmerLayout>
  );
}
