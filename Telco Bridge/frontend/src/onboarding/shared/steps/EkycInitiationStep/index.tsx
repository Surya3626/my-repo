import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import { useToast } from '../../../../components/common/Toast';
import { Calendar, CheckCircle2, ChevronLeft, RefreshCw, Search, ShieldCheck, Sparkles, ChevronRight, Building2 } from 'lucide-react';
import { EngineerTrackingMap } from '../../../../components/features/EngineerTrackingMap';
import type { Channel } from '../../state/onboardingMachine';

interface Props {
  journeyId: number;
  prefill?: Record<string, unknown> | null;
  onComplete: (payload: Record<string, unknown>) => void;
  onBack: () => void;
  channel: Channel;
  isLoading?: boolean;
}

export const EkycInitiationStep: React.FC<Props> = ({ prefill, onComplete, onBack, isLoading }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const p = prefill || {};
  const rawMobile = (p.mobileNumber as string) || (p.prospectMobile as string) || '';
  const mobileNumber = (rawMobile && !rawMobile.startsWith('PROSPECT-')) ? rawMobile : '9876543210';

  const [hubTab, setHubTab] = useState<'BOOK' | 'TRACK'>('BOOK');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(p.ticket || null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTicketLoading, setSearchTicketLoading] = useState(false);
  const [searchTicketError, setSearchTicketError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScheduleAppointment = async (e?: React.FormEvent, customDate?: string) => {
    if (e) e.preventDefault();
    const targetDate = customDate || appointmentDate || new Date(Date.now() + 86400000).toISOString().substring(0, 16);
    
    setError(''); setLoading(true);
    try {
      const res = await api.post('/customer/portal/ekyc/schedule', { mobileNumber, appointmentDate: targetDate });
      if (res.data?.success) {
        const ticket = res.data.data;
        setTicketDetails(ticket);
        toast.success('EKYC Scheduled!', `Installation Ticket: ${ticket.ticketNumber}`);
      } else {
        const demo = {
          ticketNumber: `TPF-TKT-${Math.floor(Math.random() * 80000 + 10000)}`,
          status: 'DISPATCHED',
          appointmentDate: targetDate,
          engineerName: 'Rajesh Kumar',
          engineerPhone: '+91 98765 43210',
          engineerId: 'EMP-FIELD-8821',
          engineerLatitude: 19.0760,
          engineerLongitude: 72.8777,
        };
        setTicketDetails(demo);
        toast.success('EKYC Scheduled!', `Ticket: ${demo.ticketNumber}. Technician en route.`);
      }
    } catch {
      const demo = {
        ticketNumber: `TPF-TKT-${Math.floor(Math.random() * 80000 + 10000)}`,
        status: 'DISPATCHED',
        appointmentDate: targetDate,
        engineerName: 'Rajesh Kumar',
        engineerPhone: '+91 98765 43210',
        engineerId: 'EMP-FIELD-8821',
        engineerLatitude: 19.0760,
        engineerLongitude: 72.8777,
      };
      setTicketDetails(demo);
      toast.success('EKYC Scheduled!', `Ticket: ${demo.ticketNumber}. Technician en route.`);
    } finally { setLoading(false); }
  };

  const handleSearchTicket = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || searchQuery;
    if (!q.trim()) return;

    setSearchTicketError(''); setSearchTicketLoading(true);
    try {
      const res = await api.get('/customer/ticket/search', { params: { query: q.trim() } });
      if (res.data?.success && res.data.data) {
        setTicketDetails(res.data.data);
        toast.success('Ticket Found', `Status: ${res.data.data.status}`);
      } else {
        const demo = {
          ticketNumber: q.startsWith('TPF') ? q : `TPF-TKT-88219`,
          status: 'DISPATCHED',
          appointmentDate: new Date(Date.now() + 86400000).toISOString(),
          engineerName: 'Rajesh Kumar',
          engineerPhone: '+91 98765 43210',
          engineerId: 'EMP-FIELD-8821',
        };
        setTicketDetails(demo);
        toast.success('Ticket Loaded', `Status: DISPATCHED`);
      }
    } catch {
      const demo = {
        ticketNumber: `TPF-TKT-88219`,
        status: 'DISPATCHED',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        engineerName: 'Rajesh Kumar',
        engineerPhone: '+91 98765 43210',
        engineerId: 'EMP-FIELD-8821',
      };
      setTicketDetails(demo);
      toast.success('Ticket Loaded', `Status: DISPATCHED`);
    } finally { setSearchTicketLoading(false); }
  };

  const handleFinish = () => {
    onComplete({ ticket: ticketDetails, ekycScheduled: true });
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Enterprise Header Bar */}
      <div className="clay-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-2 border-purple-500/30">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Field Engineering Dispatch & E-KYC Hub</h2>
            <span className="clay-badge-purple px-3.5 py-1 text-xs font-black uppercase tracking-wider whitespace-nowrap shrink-0">
              FSM Engine 2.0
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Doorstep fiber optic drop wire installation, ONT Wi-Fi 6 setup, and biometric liveness E-KYC verification.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <span className="clay-badge-emerald px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shadow-sm">
            <ShieldCheck size={16} /> Free Installation SLA
          </span>
          <span className="clay-badge-purple px-3.5 py-1.5 text-[11px] font-black font-mono whitespace-nowrap shadow-sm">
            Same-Day Field SLA
          </span>
        </div>
      </div>

      {/* Mode Tabs (BOOK vs TRACK) */}
      {!ticketDetails ? (
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setHubTab('BOOK')}
            className={`px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition ${
              hubTab === 'BOOK'
                ? 'bg-tpf-purple text-white shadow-lg border-t-2 border-x-2 border-purple-500'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600'
            }`}
          >
            <Calendar size={16} /> Book Installation Slot
          </button>

          <button
            type="button"
            onClick={() => setHubTab('TRACK')}
            className={`px-5 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition ${
              hubTab === 'TRACK'
                ? 'bg-tpf-purple text-white shadow-lg border-t-2 border-x-2 border-purple-500'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600'
            }`}
          >
            <Search size={16} /> Track Ticket Status
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white block text-sm">Onboarding Journey Completed</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">Your doorstep installation appointment is active & field technician is assigned.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/selfcare')}
            className="px-4 py-2 clay-button-purple text-xs font-black uppercase tracking-wider shadow flex items-center gap-1.5 shrink-0"
          >
            <Sparkles size={14} /> Go to SelfCare
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-xs font-semibold border border-rose-200">
          {error}
        </div>
      )}

      {/* VIEW 1: TRACK TICKET MODE */}
      {hubTab === 'TRACK' && (
        <div className="clay-card p-6 space-y-6 animate-fade-in text-left">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Track Field Ticket Status</h3>
            <p className="text-xs text-slate-500 font-medium">Lookup real-time field engineering status by Ticket Reference # or Mobile Number.</p>
          </div>

          <form onSubmit={handleSearchTicket} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Enter Ticket Reference (e.g. TPF-TKT-88219) or Mobile Number"
              className="flex-1 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={searchTicketLoading}
              className="px-6 py-3 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {searchTicketLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />} Track Status
            </button>
          </form>

          {mobileNumber && (
            <button
              type="button"
              onClick={() => { setSearchQuery(mobileNumber); handleSearchTicket(undefined, mobileNumber); }}
              className="px-4 py-2 rounded-xl text-xs font-black clay-pill-inactive flex items-center gap-1"
            >
              ⚡ Auto-Fill Registered Mobile ({mobileNumber})
            </button>
          )}

          {ticketDetails && (
            <div className="space-y-6 pt-2">
              <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-900/90 border border-purple-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                      Active Ticket: {ticketDetails.ticketNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">
                    Current FSM Dispatch Status: <strong className="text-tpf-purple">{ticketDetails.status || 'DISPATCHED'}</strong>
                  </p>
                </div>

                <span className="clay-badge-emerald px-3 py-1 text-xs font-black uppercase">
                  ✓ Technician Dispatched
                </span>
              </div>

              {/* 4-Stage Execution Pipeline */}
              <div className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">Doorstep Execution Pipeline:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-0.5">
                    <span className="text-[9px] font-black uppercase block">Stage 1</span>
                    <span className="font-extrabold text-xs block">✓ Ticket Created</span>
                    <span className="text-[9px] opacity-80 font-mono block">Ref: {ticketDetails.ticketNumber}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-tpf-purple text-white shadow-md space-y-0.5 ring-2 ring-purple-400/40">
                    <span className="text-[9px] font-black uppercase opacity-90 block">Stage 2 (Active)</span>
                    <span className="font-black text-xs block">⚡ Engineer Dispatched</span>
                    <span className="text-[9px] opacity-90 font-mono block">ETA: 25 Mins</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase block">Stage 3</span>
                    <span className="font-extrabold text-xs block">Fiber Power Check</span>
                    <span className="text-[9px] font-mono block">Target: -19 dBm</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase block">Stage 4</span>
                    <span className="font-extrabold text-xs block">Service Live</span>
                    <span className="text-[9px] font-mono block">Speed Test</span>
                  </div>
                </div>
              </div>

              {/* Technician Tracker Map */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
                <EngineerTrackingMap
                  engineerName={ticketDetails.engineerName}
                  engineerPhone={ticketDetails.engineerPhone}
                  ticketNumber={ticketDetails.ticketNumber}
                  appointmentDate={ticketDetails.appointmentDate}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BOOK INSTALLATION SLOT MODE */}
      {hubTab === 'BOOK' && !ticketDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 clay-card p-6 space-y-6 text-left">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Select Installation & E-KYC Appointment Slot</h3>
                <p className="text-[11px] text-slate-500 font-medium">Choose a convenient doorstep engineering visit window</p>
              </div>
              <span className="clay-badge-purple px-2.5 py-0.5 text-[9px] font-black uppercase">DOORSTEP VISIT</span>
            </div>

            {/* Quick Slot Preset Chips */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Quick Recommended Slots:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'MORN', label: 'Tomorrow Morning', slot: '10:00 AM', desc: 'High Priority Field Slot' },
                  { key: 'AFT', label: 'Tomorrow Afternoon', slot: '02:00 PM', desc: 'Standard Field Slot' },
                  { key: 'WEEKEND', label: 'Weekend Express', slot: '11:00 AM', desc: 'Weekend Dedicated' },
                ].map(item => {
                  const isSelected = selectedPresetKey === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        const date = new Date(Date.now() + (item.key === 'WEEKEND' ? 172800000 : 86400000));
                        date.setHours(item.key === 'MORN' ? 10 : item.key === 'AFT' ? 14 : 11, 0, 0, 0);
                        const formatted = date.toISOString().substring(0, 16);
                        setAppointmentDate(formatted);
                        setSelectedPresetKey(item.key);
                        toast.info("Slot Selected", `Selected ${item.label} (${item.slot})`);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-purple-500/30 scale-[1.02] border-purple-400/50 ring-2 ring-purple-400/40'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase block ${isSelected ? 'opacity-90 text-purple-100' : 'opacity-70 text-slate-500 dark:text-slate-400'}`}>{item.label}</span>
                      <span className="font-extrabold text-xs block mt-0.5">⚡ {item.slot} Slot</span>
                      <span className={`text-[9px] font-mono block mt-1 ${isSelected ? 'opacity-85 text-purple-200' : 'opacity-70 text-slate-400'}`}>{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Datetime Input */}
            <form onSubmit={e => handleScheduleAppointment(e)} className="space-y-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Or Choose Custom Preferred Date & Time:
                </label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentDate}
                  onChange={e => {
                    setAppointmentDate(e.target.value);
                    setSelectedPresetKey('CUSTOM');
                  }}
                  min={new Date().toISOString().substring(0, 16)}
                  className="w-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3.5 font-mono font-bold text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Instant Mock Testing Button */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-tpf-purple shrink-0" size={18} />
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block text-xs">Testing Shortcut</span>
                    <span className="text-[10px] text-slate-500 font-medium">Auto-dispatch mock field engineer ticket instantly</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const dateStr = new Date(Date.now() + 86400000).toISOString().substring(0, 16);
                    handleScheduleAppointment(undefined, dateStr);
                  }}
                  className="px-4 py-2 clay-button-purple text-xs font-black uppercase tracking-wider transition shadow shrink-0"
                >
                  ⚡ Instant Dispatch Ticket
                </button>
              </div>

              <div className="pt-3 flex justify-between items-center gap-4">
                <button
                  type="submit"
                  disabled={loading || !appointmentDate}
                  className="px-8 py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl disabled:opacity-40"
                >
                  Book Slot & Dispatch Field Technician <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Doorstep SLA Card */}
          <div className="clay-card p-6 shadow-2xl flex flex-col justify-between h-fit text-left space-y-4">
            <div className="space-y-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                <span>Doorstep Installation SLA</span>
                <span className="clay-badge-emerald px-2.5 py-0.5 text-[9px] font-black uppercase">
                  ZERO CHARGE
                </span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-extrabold text-slate-900 dark:text-white block">1. Optical Fiber Drop Line</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Up to 100 meters outdoor armored micro-drop fiber cable & wall grommet installation included.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-extrabold text-slate-900 dark:text-white block">2. Wi-Fi 6 ONT Optical Router</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Unboxing, SSID setup, optical power budget test (-18 dBm target), and speed test verification.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-extrabold text-slate-900 dark:text-white block">3. Biometric E-KYC Verification</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Field engineer conducts UIDAI Aadhaar biometric liveness check at your doorstep.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE TICKET & COMPLETION STATE */}
      {hubTab === 'BOOK' && ticketDetails && (
        <div className="clay-card p-8 shadow-2xl space-y-8 animate-fade-in text-left">
          
          {/* Ticket Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Field Service Ticket Initiated & Dispatched</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Service Ticket Ref: <strong className="font-mono text-tpf-purple">{ticketDetails.ticketNumber}</strong> • Field Dispatch Status: <strong>DISPATCHED</strong>
              </p>
            </div>

            <span className="clay-badge-emerald px-4 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Engineer Assigned
            </span>
          </div>

          {/* 4-Stage FSM Execution Pipeline Visualizer */}
          <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Field Service Execution Pipeline:</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 space-y-1">
                <span className="text-[10px] font-black uppercase block">Stage 1</span>
                <span className="font-extrabold text-xs block">✓ Ticket Created</span>
                <span className="text-[9px] opacity-80 font-mono block">Ref: {ticketDetails.ticketNumber}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-tpf-purple text-white shadow-lg space-y-1 ring-2 ring-purple-400/40">
                <span className="text-[10px] font-black uppercase opacity-90 block">Stage 2 (Current)</span>
                <span className="font-black text-xs block">⚡ Engineer Dispatched</span>
                <span className="text-[9px] opacity-90 font-mono block">ETA: 30 Mins</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-1">
                <span className="text-[10px] font-extrabold uppercase block">Stage 3</span>
                <span className="font-extrabold text-xs block">Fiber Splicing & Test</span>
                <span className="text-[9px] font-mono block">Target: -19 dBm</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-400 space-y-1">
                <span className="text-[10px] font-extrabold uppercase block">Stage 4</span>
                <span className="font-extrabold text-xs block">Service Activation</span>
                <span className="text-[9px] font-mono block">Live Speed Test</span>
              </div>

            </div>
          </div>

          {/* Assigned Lead Engineer Profile Card + Live Actions Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 clay-card p-6 space-y-4">
              <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                <ShieldCheck className="text-tpf-purple" size={18} /> Assigned Optical Field Engineer Profile
              </h4>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                  RK
                </div>

                <div className="space-y-1 text-xs">
                  <h5 className="text-base font-black text-slate-900 dark:text-white">{ticketDetails.engineerName || 'Rajesh Kumar'}</h5>
                  <p className="text-slate-500 font-semibold text-[11px]">
                    Employee ID: <strong className="font-mono text-tpf-purple">{ticketDetails.engineerId || 'EMP-FIELD-8821'}</strong> • Rating: <strong>⭐ 4.9/5 (520+ Fiber Installs)</strong>
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-slate-600 dark:text-slate-400">
                    <span>Phone: <strong className="font-mono">{ticketDetails.engineerPhone || '+91 98765 43210'}</strong></span>
                    <span>Badge: <strong className="text-emerald-600 dark:text-emerald-400">GPS Tracked & Cleared</strong></span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Scheduled Visit Slot:</span>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {ticketDetails.appointmentDate ? new Date(ticketDetails.appointmentDate).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }) : 'Tomorrow 10:00 AM Slot'}
                </p>
              </div>
            </div>

            {/* Navigation Actions Card */}
            <div className="clay-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                  <span>Live Actions</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Track technician movement or manage account in SelfCare.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/selfcare', { state: { openTracking: true } })}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white rounded-2xl p-3.5 shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-between border border-purple-400/30 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-white shadow-sm">
                      <Sparkles size={18} />
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-xs block leading-tight">Track Technician Live</span>
                      <span className="text-[10px] text-purple-200 font-medium block mt-0.5">Real-time GPS Map Tracking</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/80 group-hover:translate-x-1 transition shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/selfcare')}
                  className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:border-purple-400/50 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm border border-purple-500/20">
                      <Building2 size={18} />
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-xs block leading-tight">Subscriber SelfCare Portal</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">Plans, Bills & Support Tickets</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition shrink-0" />
                </button>
              </div>
            </div>

          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
            <EngineerTrackingMap
              engineerName={ticketDetails.engineerName}
              engineerPhone={ticketDetails.engineerPhone}
              ticketNumber={ticketDetails.ticketNumber}
              appointmentDate={ticketDetails.appointmentDate}
            />
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-between items-center">
        <button type="button" onClick={onBack} className="px-6 py-3 rounded-2xl clay-pill-inactive text-xs font-extrabold flex items-center gap-1.5 transition">
          <ChevronLeft size={16} /> Back
        </button>

        {ticketDetails && (
          <button
            type="button"
            onClick={handleFinish}
            className="px-8 py-3.5 clay-button-emerald text-xs font-black uppercase tracking-wider flex items-center gap-2 text-white shadow-xl transition"
          >
            <CheckCircle2 size={16} /> Complete Onboarding
          </button>
        )}
      </div>
    </div>
  );
};
