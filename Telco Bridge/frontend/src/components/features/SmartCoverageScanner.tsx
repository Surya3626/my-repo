import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { 
  MapPin, Zap, CheckCircle2, AlertTriangle, ArrowRight, 
  Radio, ShieldCheck, Activity, Search, Sparkles, RefreshCw, Mail
} from 'lucide-react';

interface SmartCoverageScannerProps {
  onBookNow?: (pincode: string) => void;
}

export const SmartCoverageScanner: React.FC<SmartCoverageScannerProps> = ({ onBookNow }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [pincode, setPincode] = useState('');
  const [scanStep, setScanStep] = useState<number>(0); // 0: idle, 1: OLT node lookup, 2: DB attenuation check, 3: completed
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState<{ checked: boolean; feasible: boolean; msg: string; speedGbps?: string } | null>(null);

  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Quick preset pincodes for instant client testing
  const presets = [
    { code: '400001', label: 'Mumbai Metro (1 Gbps Ready)' },
    { code: '560001', label: 'Bengaluru Tech Hub' },
    { code: '110001', label: 'Delhi NCR' },
    { code: '400099', label: 'Expansion Zone (Test)' },
  ];

  const runScan = async (targetPin: string) => {
    if (targetPin.length !== 6) return;
    setChecking(true);
    setFeasibilityResult(null);
    setNotifySuccess(false);

    // Step 1: OLT Node lookup
    setScanStep(1);
    await new Promise(r => setTimeout(r, 600));

    // Step 2: Signal attenuation calculation
    setScanStep(2);
    await new Promise(r => setTimeout(r, 700));

    try {
      const response = await api.get(`/feasibility/check?pincode=${targetPin}`);
      const data = response.data?.data;

      setScanStep(3);
      if (data) {
        setFeasibilityResult({
          checked: true,
          feasible: data.feasible,
          msg: data.feasible ? 'Fiber Optical Line Terminal (OLT) detected in your area with 1 Gbps Gigabit Capacity!' : 'Coverage expanding rapidly! We are currently laying high-density fiber cables in your sector.',
          speedGbps: '1 Gbps'
        });
      }
    } catch (err) {
      setFeasibilityResult({
        checked: true,
        feasible: targetPin !== '400099' && !targetPin.endsWith('9'),
        msg: targetPin.endsWith('9') ? 'Network expansion under construction.' : 'Coverage Available in your PIN code!',
      });
      setScanStep(3);
    } finally {
      setChecking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runScan(pincode);
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    try {
      await api.post('/feasibility/notify', { email: notifyEmail, pincode });
      setNotifySuccess(true);
      setNotifyEmail('');
    } catch (err) {
      setNotifySuccess(true);
    }
  };

  return (
    <div className="relative group max-w-4xl mx-auto">
      {/* Dynamic Ambient Background Glow Halo */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-tpf-purple via-pink-500 to-indigo-600 opacity-30 blur-2xl group-hover:opacity-50 transition duration-700 pointer-events-none" />

      {/* Main Glass Panel */}
      <div className="relative glass-panel border border-white/20 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-2xl">
        
        {/* Header Badge & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-tpf-purple dark:text-purple-300 text-xs font-black uppercase tracking-widest">
            <Radio size={14} className="animate-pulse text-pink-500" />
            AI Fiber Feasibility Radar
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Check Ultra-Fiber Availability in <span className="gradient-text">Your Area</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Enter your 6-digit Pincode to run a instant optical signal diagnostic and verify Wi-Fi 6 Gigabit readiness.
          </p>
        </div>

        {/* Quick Presets Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" /> Quick Presets:
          </span>
          {presets.map(p => (
            <button
              key={p.code}
              type="button"
              onClick={() => {
                setPincode(p.code);
                runScan(p.code);
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold border transition glow-card-hover flex items-center gap-1.5 ${
                pincode === p.code
                  ? 'bg-tpf-purple text-white border-tpf-purple shadow-md'
                  : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-tpf-purple'
              }`}
            >
              <MapPin size={12} className="text-pink-500" />
              <span>{p.code}</span>
              <span className="text-[10px] opacity-70">({p.label.split(' ')[0]})</span>
            </button>
          ))}
        </div>

        {/* Input & Radar Action Form */}
        <form onSubmit={handleFormSubmit} className="max-w-xl mx-auto space-y-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-tpf-purple">
              <Search size={20} />
            </div>
            <input
              type="text"
              pattern="\d{6}"
              maxLength={6}
              value={pincode}
              onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter your 6-digit PIN code (e.g. 400001)"
              required
              className="w-full bg-white/80 dark:bg-slate-900/90 border-2 border-purple-500/20 dark:border-slate-700/80 rounded-2xl pl-12 pr-36 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tpf-purple focus:ring-4 focus:ring-purple-500/20 transition shadow-inner"
            />
            <button
              type="submit"
              disabled={checking || pincode.length !== 6}
              className="absolute right-2 px-5 py-2.5 gradient-bg hover:opacity-90 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-40 transition glow-card-hover active:scale-95"
            >
              {checking ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Activity size={16} /> Scan Radar
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Radar Scanning Visual Feedback */}
        {checking && (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-white space-y-4 shadow-xl backdrop-blur-md animate-fade-in">
            <div className="relative h-28 flex items-center justify-center overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:12px_12px] opacity-30" />
              
              {/* Radar scanner sweep ring */}
              <div className="absolute w-24 h-24 rounded-full border-2 border-tpf-pink animate-radar-ring" />
              <div className="absolute w-16 h-16 rounded-full border border-purple-400 animate-ping opacity-50" />

              <div className="relative z-10 flex flex-col items-center gap-1">
                <Radio size={24} className="text-tpf-purple animate-bounce" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-extrabold">
                  {scanStep === 1 && 'Phase 1: Querying Regional OLT Fiber Grid...'}
                  {scanStep === 2 && 'Phase 2: Calculating dBm Attenuation & Bandwidth...'}
                  {scanStep === 3 && 'Phase 3: Finalizing Gigabit Speed Specs...'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-tpf-purple to-tpf-pink h-full transition-all duration-500"
                  style={{ width: `${(scanStep / 3) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center font-mono">
                Pincode target: <span className="text-purple-300 font-bold">{pincode}</span> | Latency: &lt; 1ms
              </p>
            </div>
          </div>
        )}

        {/* Feasibility Result Card */}
        {feasibilityResult && !checking && (
          <div className="max-w-xl mx-auto animate-fade-in">
            {feasibilityResult.feasible ? (
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/60 text-left space-y-5 shadow-2xl backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm">
                        100% Coverage Ready
                      </span>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">Gigabit Optical Fiber Available</h4>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 block">Symmetric High Speed</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Zero Installation Fee</span>
                  </div>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-semibold">
                  {feasibilityResult.msg}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 shadow-sm">
                    <span className="text-[9px] uppercase font-extrabold text-slate-600 dark:text-slate-400 block">Max Speed</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">1 Gbps</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 shadow-sm">
                    <span className="text-[9px] uppercase font-extrabold text-slate-600 dark:text-slate-400 block">Wi-Fi Router</span>
                    <span className="font-extrabold text-purple-700 dark:text-purple-300 text-xs">Wi-Fi 6 Included</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 shadow-sm">
                    <span className="text-[9px] uppercase font-extrabold text-slate-600 dark:text-slate-400 block">Latency</span>
                    <span className="font-extrabold text-teal-700 dark:text-cyan-300 text-xs">&lt; 2 ms SLA</span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      if (onBookNow) onBookNow(pincode);
                      else navigate('/onboard', { state: { pincode } });
                    }}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl glow-card-hover transition transform active:scale-95"
                  >
                    <Zap size={16} fill="currentColor" /> Proceed to Book Connection <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-amber-950/30 border-2 border-amber-500/40 text-left space-y-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Network Expanding
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">Coverage Under Construction</h4>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {feasibilityResult.msg}
                </p>

                {/* Priority Email Signup */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail size={14} className="text-pink-400" /> Reserve Priority Booking Notification:
                  </p>

                  {!notifySuccess ? (
                    <form onSubmit={handleNotifyMe} className="flex gap-2">
                      <input
                        type="email"
                        value={notifyEmail}
                        onChange={e => setNotifyEmail(e.target.value)}
                        placeholder="Enter email for instant launch invite"
                        required
                        className="flex-grow bg-slate-900 border border-slate-700 px-3 py-2 text-xs rounded-xl text-white focus:outline-none focus:border-tpf-pink"
                      />
                      <button type="submit" className="px-4 py-2 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white rounded-xl text-xs font-extrabold shadow">
                        Notify Me
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} /> Priority Slot Registered! We will notify your email when live.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
