import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palmtree, 
  Plane, 
  Zap, 
  PauseCircle, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Clock, 
  Compass, 
  AlertCircle 
} from 'lucide-react';

interface VacationModeAnimatorProps {
  isOnHold: boolean;
  startDate: string;
  endDate: string;
  reason: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onReasonChange: (val: string) => void;
  onActivateHold: (e: React.FormEvent) => void;
  onResumeHold: () => void;
  holdError?: string;
  holdSuccess?: boolean;
}

export const VacationModeAnimator: React.FC<VacationModeAnimatorProps> = ({
  isOnHold,
  startDate,
  endDate,
  reason,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onActivateHold,
  onResumeHold,
  holdError,
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'ACTIVATE' | 'RESUME' | null>(null);

  // Calculate hold days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const calculatedDays = Math.ceil(diffTime / (1000 * 3600 * 24));
  const isValidRange = !isNaN(calculatedDays) && calculatedDays >= 7 && calculatedDays <= 90;

  // Estimated monthly rental savings
  const estimatedSavings = isValidRange ? Math.round(calculatedDays * (999 / 30)) : 0;

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidRange) return;
    setCelebrationType('ACTIVATE');
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 2800);
    onActivateHold(e);
  };

  const handleResumeClick = () => {
    setCelebrationType('RESUME');
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 2500);
    onResumeHold();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl text-left font-sans">
      
      {/* 🌟 CELEBRATION / TRANSITION OVERLAY MODAL */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md text-white text-center pointer-events-none"
          >
            {celebrationType === 'ACTIVATE' ? (
              <div className="max-w-md p-8 rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900 to-amber-950/90 border-2 border-amber-500/40 shadow-2xl relative overflow-hidden space-y-4">
                {/* Sunbeam pulse backdrop */}
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-sunbeam-pulse pointer-events-none"></div>
                
                {/* Flying jet animation */}
                <div className="absolute top-4 left-0 w-full animate-flight-pass">
                  <Plane size={32} className="text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                </div>

                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/50"
                >
                  <Palmtree size={42} />
                </motion.div>

                <h3 className="text-2xl font-black text-white tracking-wide">
                  Vacation Mode Activated! 🌴
                </h3>
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                  Your fiber connection is safely paused for <strong>{calculatedDays} days</strong>. Zero monthly rental charges will apply until {endDate}.
                </p>

                <div className="pt-2 flex justify-center gap-3 text-2xl">
                  <span className="animate-bounce">✈️</span>
                  <span className="animate-bounce [animation-delay:150ms]">🏖️</span>
                  <span className="animate-bounce [animation-delay:300ms]">🍹</span>
                  <span className="animate-bounce [animation-delay:450ms]">🌊</span>
                </div>
              </div>
            ) : (
              <div className="max-w-md p-8 rounded-3xl bg-gradient-to-b from-emerald-500/20 via-slate-900 to-purple-950/90 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden space-y-4">
                {/* Energy Shockwave Ring */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 rounded-full border-4 border-emerald-400 animate-recharge-shockwave"></div>
                </div>

                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 180 }}
                  className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50"
                >
                  <Zap size={44} className="fill-white animate-pulse" />
                </motion.div>

                <h3 className="text-2xl font-black text-white tracking-wide">
                  Broadband Re-energized! 🚀
                </h3>
                <p className="text-xs text-emerald-200/90 font-medium leading-relaxed">
                  Welcome back! Your high-speed optical fiber connection has been instantly re-activated with full speed.
                </p>

                <div className="pt-2 flex justify-center gap-2 text-xs font-black uppercase text-emerald-400 tracking-widest">
                  <span>⚡ 1 GBPS LIGHTSPEED ONLINE ⚡</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN ANIMATED CARD CONTAINER ─── */}
      <div className={`p-6 md:p-8 space-y-6 border-2 rounded-3xl backdrop-blur-2xl transition-all duration-700 relative overflow-hidden shadow-2xl ${
        isOnHold 
          ? 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-900/80 border-amber-500/50 text-white shadow-amber-500/10'
          : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-purple-500/10'
      }`}>

        {/* Dynamic Background Effects */}
        {isOnHold ? (
          <>
            {/* Ambient Tropical Sunbeam Radial */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-sunbeam-pulse pointer-events-none"></div>
            
            {/* Animated flying jet */}
            <div className="absolute top-6 left-0 w-full animate-flight-pass opacity-70 pointer-events-none">
              <Plane size={24} className="text-amber-400" />
            </div>

            {/* Floating Tropical Micro Particles */}
            <div className="absolute bottom-4 right-8 opacity-20 pointer-events-none flex gap-4 text-3xl">
              <span className="animate-vacation-float">🌴</span>
              <span className="animate-vacation-float [animation-delay:1s]">🏖️</span>
              <span className="animate-vacation-float [animation-delay:2s]">🌊</span>
            </div>
          </>
        ) : (
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        )}

        {/* Card Header Section */}
        <div className="border-b border-slate-200/20 dark:border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-xl transition-all duration-500 ${
              isOnHold 
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 animate-vacation-float' 
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
            }`}>
              {isOnHold ? <Palmtree size={24} /> : <PauseCircle size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black tracking-tight">Vacation Mode &amp; Service Pause</h4>
                {isOnHold && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </div>
              <p className={`text-xs font-medium ${isOnHold ? 'text-amber-200/80' : 'text-slate-500 dark:text-slate-400'}`}>
                Pause connection billing during out-of-town travel with 100% zero rental charges.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="clay-badge-purple px-3 py-1 text-[10px] font-black uppercase tracking-wider">
              TRAI Compliant 2024
            </span>
          </div>
        </div>

        {/* TRAI Mandate Banner */}
        <div className={`p-4 rounded-2xl text-xs space-y-1 relative z-10 transition-colors duration-500 border ${
          isOnHold
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-black uppercase tracking-wider block text-[10px] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-400" />
              TRAI Telecom Regulatory Order:
            </span>
            <span className="text-[10px] font-extrabold text-emerald-400">0% RENTAL MANDATE</span>
          </div>
          <p className="text-[11px] leading-relaxed font-medium opacity-90">
            Subscribers can place broadband connections on temporary suspension for a minimum of <strong>7 days</strong> up to <strong>90 days</strong> per calendar year with zero monthly charges.
          </p>
        </div>

        {/* Error / Feedback banners */}
        {holdError && (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center gap-2">
            <AlertCircle size={16} /> {holdError}
          </div>
        )}

        {/* ─── DYNAMIC STATE VIEW ─── */}
        <AnimatePresence mode="wait">
          {isOnHold ? (
            /* 🌴 ACTIVE VACATION HOLD VIEW (PAUSED) */
            <motion.div
              key="vacation-active-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 relative z-10"
            >
              {/* Main Status Callout Header */}
              <div className="p-6 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 text-xs space-y-4 shadow-xl relative overflow-hidden backdrop-blur-xl">
                
                {/* Floating Stamp Approved Effect */}
                <div className="absolute top-4 right-4 rotate-[-6deg] px-3 py-1 rounded-xl border-2 border-emerald-400 text-emerald-400 font-black text-[10px] uppercase tracking-widest bg-emerald-950/60 shadow-lg animate-stamp-bounce">
                  ✓ ZERO RENTAL APPROVED
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-500/30 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/40">
                        <PauseCircle size={26} />
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping"></span>
                    </div>
                    <div>
                      <h4 className="font-black text-white text-lg tracking-tight flex items-center gap-2">
                        Broadband Service Currently Paused 🌴
                      </h4>
                      <p className="text-amber-200/80 text-xs font-medium">
                        Zero tariff charge applied from <strong className="font-mono text-white">{startDate}</strong> to <strong className="font-mono text-white">{endDate}</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] text-amber-300/70 font-black uppercase block flex items-center gap-1">
                      <Calendar size={12} /> Pause Start Date
                    </span>
                    <strong className="text-white font-mono text-sm block">{startDate}</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] text-amber-300/70 font-black uppercase block flex items-center gap-1">
                      <Clock size={12} /> Scheduled Resume
                    </span>
                    <strong className="text-white font-mono text-sm block">{endDate}</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-black uppercase block flex items-center gap-1">
                      <Sparkles size={12} /> Total Estimated Savings
                    </span>
                    <strong className="text-emerald-400 font-black text-sm block font-mono">
                      ₹{estimatedSavings || '750'} SAVED (100% WAIVED)
                    </strong>
                  </div>
                </div>

                {/* Dynamic Travel Quote / Ambient Banner */}
                <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-200 text-[11px] font-medium flex items-center gap-2">
                  <span>✈️</span> Enjoy your time away! We will automatically re-activate your connection on {endDate}. Need fiber before then? Click below anytime.
                </div>

                {/* RESUME BUTTON (High Impact Energy Button) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleResumeClick}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-2 group transition-all"
                >
                  <Zap size={18} className="fill-white group-hover:scale-125 transition-transform" />
                  Resume Connection Now (Cancel Hold &amp; Turn Fiber Back ON)
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* 📝 VACATION HOLD FORM VIEW (RESUMED / STANDARD) */
            <motion.div
              key="vacation-form-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 relative z-10"
            >
              <form onSubmit={handleActivateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-extrabold">
                  
                  {/* Pause Start Date */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase block flex items-center gap-1.5">
                      <Calendar size={14} className="text-amber-500" />
                      Pause Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full clay-input px-4 py-3.5 font-mono text-xs dark:text-white focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Pause Resume Date */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase block flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-500" />
                      Pause Resume Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full clay-input px-4 py-3.5 font-mono text-xs dark:text-white focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Reason for hold */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase block flex items-center gap-1.5">
                      <Compass size={14} className="text-purple-500" />
                      Reason for Temporary Hold
                    </label>
                    <input
                      type="text"
                      required
                      value={reason}
                      onChange={(e) => onReasonChange(e.target.value)}
                      placeholder="e.g. Out of town vacation / Official work trip"
                      className="w-full clay-input px-4 py-3.5 text-xs dark:text-white focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* Live Hold Calculator Preview Badge */}
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-black uppercase block">Calculated Suspension Period</span>
                    <strong className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {isValidRange ? `${calculatedDays} Days (TRAI Approved)` : 'Invalid Date Range (Must be 7 to 90 days)'}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {isValidRange && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase font-mono">
                        ₹{estimatedSavings} Estimated Savings
                      </span>
                    )}
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      isValidRange ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-rose-500 text-white'
                    }`}>
                      {isValidRange ? 'VALID RANGE ✓' : 'INVALID RANGE ✖'}
                    </span>
                  </div>
                </div>

                {/* ENABLE BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!isValidRange}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Palmtree size={18} className="animate-vacation-float" /> Turn Vacation Hold Mode ON
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
