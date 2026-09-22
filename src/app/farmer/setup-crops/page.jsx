'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FarmerLayout from '@/components/farmer/FarmerLayout';
import { farmerService } from '@/services/farmerService';
import { WheatVectorIcon, PaddyVectorIcon, MaizeVectorIcon } from '@/components/farmer/FarmIllustrations';
import { Sprout, PlusCircle, Edit3, Trash2, Calendar, Sparkles, ArrowRight, Save, CheckCircle2 } from 'lucide-react';

export default function CropSetupPage() {
  const router = useRouter();
  const [crops, setCrops] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: 'Wheat',
    quantity: '1200',
    unit: 'kg',
    harvestStatus: 'Ready for Procurement',
    expectedHarvestDate: '2026-09-15',
    notes: 'High quality grain ready for mandi sale.',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [errors, setErrors] = useState({});

  const refreshCrops = () => {
    const list = farmerService.getCrops();
    setCrops(list);
  };

  useEffect(() => {
    refreshCrops();
  }, []);

  const handleAddCrop = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name) errs.name = 'Please select a crop name.';
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than 0.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    farmerService.addCrop(formData);
    refreshCrops();
    setShowAddForm(false);
    setFormData({
      name: 'Paddy',
      quantity: '850',
      unit: 'kg',
      harvestStatus: 'Nearly Ready',
      expectedHarvestDate: '2026-09-28',
      notes: '',
    });
  };

  const handleRemoveCrop = (id) => {
    try {
      farmerService.removeCrop(id);
      refreshCrops();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProceedToAI = () => {
    if (crops.length === 0) {
      alert('Please add at least one crop before finding a slot.');
      return;
    }
    const firstCrop = crops[0];
    router.push(`/farmer/recommendation?cropId=${firstCrop.id}&qty=${firstCrop.quantity}&unit=${firstCrop.unit}`);
  };

  const getCropVectorIcon = (name) => {
    if (name === 'Wheat') return <WheatVectorIcon />;
    if (name === 'Paddy' || name === 'Rice') return <PaddyVectorIcon />;
    return <MaizeVectorIcon />;
  };

  return (
    <FarmerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Step Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden space-y-3">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          <span className="inline-block px-3 py-1 bg-emerald-700/80 text-emerald-100 rounded-full text-xs font-bold uppercase tracking-wider">
            Step 1 of 3 • Initial Harvest Setup
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold">Let's add your crops 🌾</h1>
          <p className="text-emerald-100 text-sm max-w-xl leading-relaxed">
            Add the crops you want to sell and we'll help you find a suitable procurement slot with shortest queue wait time.
          </p>
        </div>

        {/* Existing Added Crops List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sprout size={20} className="text-emerald-600" />
              Your Registered Crops ({crops.length})
            </h2>

            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <PlusCircle size={15} /> Add Another Crop
              </button>
            )}
          </div>

          {crops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCropVectorIcon(c.name)}
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                        <p className="text-xs text-slate-500 font-semibold">
                          {c.quantity.toLocaleString()} {c.unit}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        c.harvestStatus === 'Ready for Procurement'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.harvestStatus === 'Nearly Ready'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.harvestStatus}
                    </span>
                    <p className="text-[11px] text-slate-500">Expected: {c.expectedHarvestDate}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      onClick={() => handleRemoveCrop(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Crop Card Option */}
              {!showAddForm && (
                <div
                  onClick={() => setShowAddForm(true)}
                  className="p-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/70 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusCircle size={22} />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">+ Add Another Crop</span>
                  <span className="text-[11px] text-slate-500">
                    Add more crops to get better recommendations.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No crops added yet.</p>
          )}

          {/* Add Crop Form */}
          {showAddForm && (
            <form onSubmit={handleAddCrop} className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <h3 className="font-bold text-sm text-emerald-900">Enter Crop Details</h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crop Name</label>
                  <select
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Wheat">Wheat</option>
                    <option value="Paddy">Paddy</option>
                    <option value="Rice">Rice</option>
                    <option value="Maize">Maize</option>
                    <option value="Mustard">Mustard</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-600"
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="px-2 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                      <option value="tonne">tonne</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harvest Status</label>
                  <select
                    value={formData.harvestStatus}
                    onChange={(e) => setFormData({ ...formData, harvestStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="Ready for Procurement">Ready for Procurement</option>
                    <option value="Nearly Ready">Nearly Ready</option>
                    <option value="Growing">Growing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    value={formData.expectedHarvestDate}
                    onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
                >
                  <Save size={15} /> Save Crop
                </button>
              </div>
            </form>
          )}

          {/* Prominent Next Action CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              We'll compare procurement centres, distance, queue load and available capacity for your added crops.
            </p>

            <button
              onClick={handleProceedToAI}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              <span>✨ Find Best Slot</span>
            </button>
          </div>
        </div>
      </div>
    </FarmerLayout>
  );
}
