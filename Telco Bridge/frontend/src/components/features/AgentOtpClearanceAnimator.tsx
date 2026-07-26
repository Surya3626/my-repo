import React, { useState } from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, Lock, UserCheck, KeyRound, Radio } from 'lucide-react';

interface AgentOtpClearanceAnimatorProps {
  agentOtpCode: string;
  onChange: (code: string) => void;
  isValidating?: boolean;
  isSuccess?: boolean;
  agentId?: string;
  label?: string;
  sublabel?: string;
}

export const AgentOtpClearanceAnimator: React.FC<AgentOtpClearanceAnimatorProps> = ({
  agentOtpCode,
  onChange,
  isValidating = false,
  isSuccess = false,
  agentId = 'AG-98402',
  label = '1. Sales Agent Security Clearance Code',
  sublabel = 'Field Representative Security OTP sent to Agent Terminal App',
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const codeArr = agentOtpCode.padStart(6, ' ').split('');
    codeArr[index] = cleanDigit || ' ';
    const newCode = codeArr.join('').trimEnd();
    onChange(newCode);

    // Auto focus next box
    if (cleanDigit && index < 5) {
      const nextInput = document.getElementById(`agent-otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !agentOtpCode[index] && index > 0) {
      const prevInput = document.getElementById(`agent-otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="clay-card p-6 rounded-3xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-950 text-white space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-xl text-left">
      
      {/* Top Fiber Radar Scan Beam */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-emerald-400 animate-fiber-beam shadow-[0_0_15px_#f59e0b]" />

      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <ShieldCheck size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">AGENT 2FA AUTHORIZATION GATEWAY</span>
            <h4 className="text-xs font-black text-white">{label}</h4>
          </div>
        </div>

        <span className="clay-badge-purple px-2.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">
          <UserCheck size={12} className="text-amber-400" />
          AGENT #{agentId}
        </span>
      </div>

      {/* Futuristic Dual-Key Hexagonal Iris Lock & Animation */}
      <div className="flex flex-col items-center justify-center py-2 relative">
        <div className="relative w-24 h-24 flex items-center justify-center">
          
          {/* Outer Gold/Purple Clearance Ring */}
          <div 
            className={`absolute inset-0 rounded-full border-2 border-amber-500/40 border-t-amber-400 border-r-purple-500 transition-all ${
              isSuccess ? 'border-emerald-400 animate-none scale-110' : 'animate-spin'
            }`}
            style={{ animationDuration: '4s' }}
          />

          {/* Inner Counter-Spinning Pulse Ring */}
          <div 
            className={`absolute inset-3 rounded-full border border-purple-400/30 border-b-emerald-400 transition-all ${
              isSuccess ? 'border-emerald-400 animate-none' : 'animate-spin'
            }`}
            style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}
          />

          {/* Core Biometric Badge Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl z-10 transition-all duration-500 ${
            isSuccess 
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white scale-110 shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-pop-bounce'
              : 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-amber-600 text-white shadow-purple-500/30'
          }`}>
            {isSuccess ? (
              <CheckCircle2 size={34} className="animate-bounce" />
            ) : isValidating ? (
              <Radio size={30} className="animate-ping text-amber-300" />
            ) : (
              <KeyRound size={28} className="animate-pulse" />
            )}
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="text-center mt-3 space-y-0.5">
          <p className={`text-xs font-black uppercase tracking-wider ${
            isSuccess ? 'text-emerald-400' : 'text-amber-300'
          }`}>
            {isSuccess ? '✓ Sales Agent Security Clearance Verified' : 'Executive Security Key Pending'}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {sublabel}
          </p>
        </div>
      </div>

      {/* 6 Individual 3D Agent Pin Boxes */}
      <div className="grid grid-cols-6 gap-2 pt-1">
        {Array.from({ length: 6 }).map((_, idx) => {
          const digit = agentOtpCode[idx] || '';
          const isFilled = digit.length > 0;
          const isFocused = focusedIndex === idx;

          return (
            <input
              key={idx}
              id={`agent-otp-input-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onFocus={() => setFocusedIndex(idx)}
              onBlur={() => setFocusedIndex(null)}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`h-12 w-full text-center font-mono font-black text-xl rounded-2xl border-2 transition-all duration-200 outline-none shadow-inner ${
                isSuccess
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : isFocused
                  ? 'bg-slate-900 border-amber-400 text-amber-300 ring-4 ring-amber-400/20 scale-105'
                  : isFilled
                  ? 'bg-slate-900 border-purple-500 text-purple-200'
                  : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {/* Quick Test Mode Auto-Fill Shortcut Pill */}
      <div className="pt-1 flex items-center justify-between gap-2">
        <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" />
          Test Agent Pin: <strong className="text-amber-300">123456</strong>
        </span>
        <button
          type="button"
          onClick={() => onChange('123456')}
          className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[9px] font-black uppercase tracking-wider transition"
        >
          ⚡ Auto-Fill Agent Pin
        </button>
      </div>

    </div>
  );
};
