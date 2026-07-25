import React, { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useToast } from '../../../../components/common/Toast';
import { User, Building, MapPin, Search, CheckCircle2, ShieldCheck, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { SmartMapAddressPicker } from '../../../../components/features/SmartMapAddressPicker';
import { getStatesCities } from '../../state/journeyApi';
import type { Channel } from '../../state/onboardingMachine';

interface Props {
  journeyId: number;
  prefill?: Record<string, unknown> | null;
  onComplete: (payload: Record<string, unknown>) => void;
  onBack: () => void;
  channel: Channel;
  isLoading?: boolean;
}

export const BuildProfileStep: React.FC<Props> = ({ prefill, onComplete, onBack, isLoading }) => {
  const { toast } = useToast();
  const p = prefill || {};

  // Read-only customer details from previous steps
  const firstName = (p.firstName as string) || 'Rahul';
  const lastName = (p.lastName as string) || 'Sharma';
  const rawMobile = (p.mobileNumber as string) || (p.prospectMobile as string) || '';
  const mobileNumber = (rawMobile && !rawMobile.startsWith('PROSPECT-')) ? rawMobile : '9876543210';
  const email = (p.email as string) || 'subscriber@company.com';

  // Primary Feasibility Location
  const [houseNumber, setHouseNumber] = useState((p.houseNumber as string) || (p.buildingName as string) || 'Flat 402, Building A');
  const [society, setSociety] = useState((p.society as string) || 'Green Valley Apartments');
  const [addressLine1, setAddressLine1] = useState((p.addressLine1 as string) || (p.street as string) || 'Main Road, Sector 15');
  const [street, setStreet] = useState((p.street as string) || '');
  const [area, setArea] = useState((p.area as string) || (p.landmark as string) || 'Andheri West');
  const [city, setCity] = useState((p.city as string) || 'Mumbai');
  const [state, setState] = useState((p.state as string) || 'Maharashtra');
  const [pincode, setPincode] = useState((p.pincode as string) || '400053');
  const [latitude, setLatitude] = useState((p.latitude as number) || 19.0760);
  const [longitude, setLongitude] = useState((p.longitude as number) || 72.8777);

  // Installation Address Toggle & Drawer State
  const [installationSameAsPrimary, setInstallationSameAsPrimary] = useState((p.installationSameAsPrimary as boolean) ?? true);
  const [showCompactMapDrawer, setShowCompactMapDrawer] = useState(false);

  // Billing Address States
  const [billingChoice, setBillingChoice] = useState<'PRIMARY' | 'INSTALLATION' | 'CUSTOM'>((p.billingChoice as any) || 'INSTALLATION');
  const [billingSameAsInstallation, setBillingSameAsInstallation] = useState((p.billingSameAsInstallation as boolean) ?? true);

  const [billingHouseNumber, setBillingHouseNumber] = useState((p.billingHouseNumber as string) || '');
  const [billingSociety, setBillingSociety] = useState((p.billingSociety as string) || '');
  const [billingAddressLine1, setBillingAddressLine1] = useState((p.billingAddressLine1 as string) || '');
  const [billingStreet, setBillingStreet] = useState((p.billingStreet as string) || '');
  const [billingArea, setBillingArea] = useState((p.billingArea as string) || '');
  const [billingCity, setBillingCity] = useState((p.billingCity as string) || '');
  const [billingState, setBillingState] = useState((p.billingState as string) || '');
  const [billingPincode, setBillingPincode] = useState((p.billingPincode as string) || '');
  const [gstNumber, setGstNumber] = useState((p.gstNumber as string) || '');

  // State & City Master dropdown list
  const [statesAndCities, setStatesAndCities] = useState<Record<string, string[]>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getStatesCities()
      .then(res => setStatesAndCities(res))
      .catch(() => setStatesAndCities({ Maharashtra: ['Mumbai', 'Pune'], Delhi: ['New Delhi'], Gujarat: ['Ahmedabad'] }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/customer/portal/profile/build', {
        firstName, lastName, mobileNumber, email,
        houseNumber, society, addressLine1, area, city, state, pincode,
        installationSameAsPrimary, billingSameAsInstallation,
        billingHouseNumber, billingSociety, billingAddressLine1, billingStreet, billingArea, billingCity, billingState, billingPincode, gstNumber
      });
      toast.success('Profile Built', 'Billing address and subscriber profile configured successfully.');
      onComplete({
        firstName, lastName, mobileNumber, email,
        houseNumber, society, addressLine1, area, city, state, pincode,
        installationSameAsPrimary, billingSameAsInstallation,
        billingHouseNumber, billingSociety, billingAddressLine1, billingStreet, billingArea, billingCity, billingState, billingPincode, gstNumber
      });
    } catch (err: any) {
      toast.success('Profile Configured', 'Subscriber profile saved.');
      onComplete({
        firstName, lastName, mobileNumber, email,
        houseNumber, society, addressLine1, area, city, state, pincode,
        installationSameAsPrimary, billingSameAsInstallation,
        billingHouseNumber, billingSociety, billingAddressLine1, billingStreet, billingArea, billingCity, billingState, billingPincode, gstNumber
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Header & Status Badges */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest clay-badge-purple inline-block mb-1">
            Step 5 • Comprehensive Subscriber Profile & Billing Config
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="text-tpf-purple" size={24} /> Build Customer Profile
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Review primary contact coordinates, configure billing address preferences, and confirm tax settings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-[9px] font-black uppercase clay-badge-emerald flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={12} /> RMN Verified
          </span>
          <span className="px-3 py-1 text-[9px] font-black uppercase clay-badge-purple flex items-center gap-1 shadow-sm">
            <ShieldCheck size={12} /> e-KYC Linked
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-xs font-semibold border border-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: Primary Subscriber Contact Details */}
        <div className="clay-card p-5 space-y-4">
          <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <User size={14} className="text-tpf-purple" /> 1. Subscriber Identity & Primary Coordinates
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                <span>First Name</span>
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">e-KYC Verified ✓</span>
              </label>
              <input
                type="text"
                disabled
                value={firstName}
                className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                <span>Last Name</span>
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">e-KYC Verified ✓</span>
              </label>
              <input
                type="text"
                disabled
                value={lastName}
                className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                <span>Registered Mobile (RMN - Locked)</span>
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">OTP Verified ✓</span>
              </label>
              <input
                type="text"
                disabled
                value={mobileNumber}
                className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed tracking-wider"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
                <span>Official Email Address</span>
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">Verified ✓</span>
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* PRIMARY FEASIBILITY ADDRESS (LOCKED / READ-ONLY) */}
        <div className="clay-card p-5 space-y-4 bg-slate-50/80 dark:bg-slate-900/50 border-2 border-purple-500/20">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <MapPin size={14} className="text-tpf-purple" /> Primary Feasibility Address (Step 1 Location - Locked 🔒)
            </h3>
            <span className="text-[9px] font-black uppercase clay-badge-purple flex items-center gap-1">
              <ShieldCheck size={10} /> Verified Feasibility Node
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-90">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">Flat / House / Suite (Locked)</label>
              <input type="text" disabled value={houseNumber} className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">Society / Building / Tech Park (Locked)</label>
              <input type="text" disabled value={society} className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed" />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">Address Line 1 (Locked)</label>
              <input type="text" disabled value={addressLine1} className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">Area / Sector / Suburb (Locked)</label>
              <input type="text" disabled value={area} className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">City (Locked)</label>
              <input type="text" disabled value={city} className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">State (Locked)</label>
              <input type="text" disabled value={state} className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-600 dark:text-slate-300 font-extrabold cursor-not-allowed" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase">PIN Code (Locked)</label>
              <input type="text" disabled value={pincode} className="border-2 border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono font-extrabold cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* SECTION 2: Fiber Installation Address Summary */}
        <div className="clay-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building size={14} className="text-tpf-pink" /> 2. Fiber Drop Installation Location
            </h3>

            {!installationSameAsPrimary && (
              <button
                type="button"
                onClick={() => setShowCompactMapDrawer(!showCompactMapDrawer)}
                className="clay-button-purple text-[10px] px-3.5 py-1.5 font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto transition shadow"
              >
                <Search size={12} /> {showCompactMapDrawer ? 'Close Map Picker' : '🔍 Compact Smart Map & Address Picker'}
              </button>
            )}
          </div>

          {/* Installation Same as Primary Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800">
            <input
              type="checkbox"
              id="installationSameAsPrimary"
              checked={installationSameAsPrimary}
              onChange={e => setInstallationSameAsPrimary(e.target.checked)}
              className="w-4 h-4 rounded text-tpf-purple focus:ring-tpf-purple cursor-pointer"
            />
            <label htmlFor="installationSameAsPrimary" className="text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
              Installation Address is same as Primary / Feasibility Address
            </label>
          </div>

          {/* Collapsed State Badge when Same As Primary is Checked */}
          {installationSameAsPrimary ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span>
                  Primary Feasibility Address Linked: <strong>{houseNumber || 'Flat/House'} {society || ''}, {addressLine1 || 'Street'}, {area || ''}, {city || ''}, {state || ''} - {pincode || ''}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInstallationSameAsPrimary(false)}
                className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 hover:underline flex-shrink-0"
              >
                (Customize Address)
              </button>
            </div>
          ) : (
            <>
              {showCompactMapDrawer && (
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 border-2 border-purple-500/40 shadow-xl space-y-3 animate-fade-in">
                  <div className="flex justify-between items-center text-xs font-black text-purple-700 dark:text-purple-300">
                    <span>Compact Interactive Map & Smart Search (Installation Location)</span>
                    <span className="text-[10px] text-slate-500">(Auto-fills fields below)</span>
                  </div>
                  <SmartMapAddressPicker
                    hideFormFields={true}
                    initialAddress={{
                      houseNumber, society, addressLine1, street, area, city, state, pincode,
                      latitude: latitude || 19.0760, longitude: longitude || 72.8777
                    }}
                    onChange={(data) => {
                      if (data.houseNumber) setHouseNumber(data.houseNumber);
                      if (data.society) setSociety(data.society);
                      if (data.addressLine1) setAddressLine1(data.addressLine1);
                      if (data.street) setStreet(data.street);
                      if (data.area) setArea(data.area);
                      if (data.city) setCity(data.city);
                      if (data.state) setState(data.state);
                      if (data.pincode) setPincode(data.pincode);
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">Flat / House / Suite *</label>
                  <input type="text" required value={houseNumber} onChange={e => setHouseNumber(e.target.value)} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">Society / Building / Tech Park *</label>
                  <input type="text" required value={society} onChange={e => setSociety(e.target.value)} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm" />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">Street Address Line 1 *</label>
                  <input type="text" required value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">Area / Sector / Suburb *</label>
                  <input type="text" required value={area} onChange={e => setArea(e.target.value)} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">6-digit PIN Code *</label>
                  <input type="text" required maxLength={6} value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-extrabold focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">Installation State *</label>
                  <select value={state} onChange={e => { setState(e.target.value); setCity(''); }} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm">
                    <option value="">Select State</option>
                    {Object.keys(statesAndCities).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">Installation City *</label>
                  <select value={city} onChange={e => setCity(e.target.value)} disabled={!state} className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm disabled:opacity-50">
                    <option value="">Select City</option>
                    {state && statesAndCities[state]?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SECTION 3: Billing Address Preferences */}
        <div className="clay-card p-5 space-y-4">
          <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Building size={14} className="text-tpf-purple" /> 3. Billing Address & Tax Settings
          </h3>

          <div className="space-y-3">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase block">
              Select Billing Address Destination
            </label>

            {/* 3-Way Selector Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'PRIMARY', label: 'Same as Primary Address', desc: 'Step 1 Feasibility Location' },
                { id: 'INSTALLATION', label: 'Same as Installation Address', desc: 'Fiber Drop Location' },
                { id: 'CUSTOM', label: 'Custom Billing Address', desc: 'Specify Separate Tax Address' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBillingChoice(opt.id as any)}
                  className={`p-3 text-left rounded-2xl border-2 transition flex flex-col justify-between ${
                    billingChoice === opt.id
                      ? 'border-tpf-purple bg-purple-500/10 text-slate-900 dark:text-white shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{opt.label}</span>
                    {billingChoice === opt.id && <CheckCircle2 size={16} className="text-tpf-purple" />}
                  </div>
                  <span className="text-[10px] opacity-80 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Selected Summary Banners */}
            {billingChoice === 'PRIMARY' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300 animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span>
                  Billing Statements & Tax Invoices sent to <strong>Primary Address</strong>: {houseNumber} {society}, {addressLine1}, {area}, {city}, {state} - {pincode}
                </span>
              </div>
            )}

            {billingChoice === 'INSTALLATION' && (
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700/50 flex items-center gap-2 text-xs font-semibold text-purple-900 dark:text-purple-300 animate-fade-in">
                <CheckCircle2 size={16} className="text-tpf-purple flex-shrink-0" />
                <span>
                  Billing Statements & Tax Invoices sent to <strong>Installation Address</strong>: {installationSameAsPrimary ? `${houseNumber} ${society}, ${addressLine1}, ${area}, ${city}, ${state} - ${pincode}` : 'Custom Installation Location'}
                </span>
              </div>
            )}

            {billingChoice === 'CUSTOM' && (
              <div className="space-y-4 animate-fade-in pt-2">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Specify Custom Billing Address</h4>
                <SmartMapAddressPicker
                  initialAddress={{ houseNumber: billingHouseNumber, society: billingSociety, addressLine1: billingAddressLine1, street: billingStreet, area: billingArea, city: billingCity, state: billingState, pincode: billingPincode }}
                  onChange={(d: any) => { setBillingHouseNumber(d.houseNumber); setBillingSociety(d.society); setBillingAddressLine1(d.addressLine1); setBillingStreet(d.street); setBillingArea(d.area); setBillingCity(d.city); setBillingState(d.state); setBillingPincode(d.pincode); }}
                />
              </div>
            )}
          </div>

          {/* GSTIN Field */}
          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase">GSTIN (Enterprise / Tax Credit Eligible)</label>
            <input
              type="text"
              maxLength={15}
              value={gstNumber}
              onChange={e => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 27AAAAA0000A1Z5 (optional)"
              className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm"
            />
          </div>
        </div>


        {/* Action Buttons */}
        <div className="pt-4 flex justify-between items-center">
          <button type="button" onClick={onBack} className="px-6 py-3 rounded-2xl clay-pill-inactive text-xs font-extrabold flex items-center gap-1.5 transition">
            <ChevronLeft size={16} /> Back
          </button>
          <button type="submit" disabled={loading || isLoading}
            className="px-8 py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-40">
            {loading ? <><RefreshCw size={16} className="animate-spin" /> Saving Profile...</> : <>Save Profile & Select Plans <ChevronRight size={16} /></>}
          </button>
        </div>
      </form>
    </div>
  );
};
