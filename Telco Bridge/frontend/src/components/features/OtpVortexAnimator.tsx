import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, Sparkles } from 'lucide-react';

interface OtpVortexAnimatorProps {
  otpCode: string;
  onChange: (code: string) => void;
  isValidating?: boolean;
  isSuccess?: boolean;
  isFailed?: boolean;
  onAnimationComplete?: () => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

export const OtpVortexAnimator: React.FC<OtpVortexAnimatorProps> = ({
  otpCode,
  onChange,
  isValidating = false,
  isSuccess = false,
  isFailed = false,
  onAnimationComplete,
  label = "Authorization Code (6-Digit OTP)",
  sublabel = "Enter the 6-digit verification code broadcasted to your mobile number.",
  disabled = false,
}) => {
  const [animStage, setAnimStage] = useState<'idle' | 'swirling' | 'fusion' | 'result'>('idle');

  // Trigger animation sequence ONLY when validating or success occurs (e.g. user clicks Verify)
  useEffect(() => {
    if (isValidating || isSuccess) {
      setAnimStage('swirling');

      const t1 = setTimeout(() => {
        setAnimStage('fusion');
      }, 750);

      const t2 = setTimeout(() => {
        setAnimStage('result');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 1350);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (isFailed) {
      setAnimStage('result');
    } else {
      setAnimStage('idle');
    }
  }, [isValidating, isSuccess, isFailed]);

  const digits = (otpCode + '      ').slice(0, 6).split('');

  const handleDigitChange = (index: number, val: string) => {
    if (disabled || isSuccess) return;
    const clean = val.replace(/\D/g, '');
    const arr = otpCode.split('');
    arr[index] = clean.slice(-1) || '';
    const newCode = arr.join('');
    onChange(newCode);

    // Auto-focus next input box
    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-vortex-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-vortex-box-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div className="space-y-3 text-left relative">
      {/* Header Label */}
      {label && (
        <div className="flex justify-between items-center">
          <div>
            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400" />
              {label}
            </label>
            {sublabel && (
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{sublabel}</span>
            )}
          </div>
          {isSuccess && (
            <span className="clay-badge-emerald px-3 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-victory-burst shadow-lg">
              <CheckCircle2 size={14} /> OTP AUTHORIZED
            </span>
          )}
        </div>
      )}

      {/* Main Interactive Stage Container (Clean, Borderless, Seamless UI) */}
      <div className="relative min-h-[90px] flex items-center justify-center py-2 px-1">

        {/* ─── IDLE STAGE: 6 Clean Integrated 3D Digit Input Cards ─── */}
        {animStage === 'idle' && (
          <div className={`flex justify-center items-center gap-2.5 sm:gap-3.5 w-full relative z-10 ${isFailed ? 'animate-shake-error' : ''}`}>
            {digits.map((digit, idx) => {
              const isFilled = Boolean(digit.trim());
              return (
                <div
                  key={idx}
                  className={`relative transition-all duration-300 ${
                    isFilled ? 'scale-105' : 'scale-100'
                  }`}
                >
                  <input
                    id={`otp-vortex-box-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    disabled={disabled}
                    value={digit.trim()}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-11 h-13 sm:w-13 sm:h-14 text-center font-mono font-black text-xl sm:text-2xl rounded-2xl border-2 transition-all duration-300 shadow-md ${
                      isFilled
                        ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white border-purple-400 shadow-purple-500/30 scale-105 animate-pop-bounce'
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20'
                    }`}
                  />
                  {isFilled && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-md animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── STAGE 1: DRAMATIC 3D LIFT IN AIR & SWIRL ─── */}
        {animStage === 'swirling' && (
          <div className="relative w-full h-24 flex items-center justify-center">
            {digits.map((digit, idx) => {
              const angle = (idx * 60) * (Math.PI / 180);
              const tx = Math.round(Math.cos(angle) * 55);
              const ty = Math.round(Math.sin(angle) * 35);
              return (
                <div
                  key={idx}
                  className="absolute w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-mono font-black text-2xl shadow-2xl ring-4 ring-purple-400/40 animate-orbit-swirl"
                  style={{
                    '--tw-translate-x': `${tx}px`,
                    '--tw-translate-y': `${ty}px`,
                    animationDelay: `${idx * 70}ms`,
                  } as React.CSSProperties}
                >
                  {digit || (idx + 1)}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── STAGE 2: CENTRAL ENERGY CORE FUSION ─── */}
        {animStage === 'fusion' && (
          <div className="relative flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full border-4 border-purple-500/60 animate-shockwave" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-emerald-400 flex items-center justify-center shadow-2xl animate-fusion-core">
              <Sparkles className="text-white animate-spin" size={28} />
            </div>
          </div>
        )}

        {/* ─── STAGE 3: VICTORY TICK OR ERROR EXPLOSION ─── */}
        {animStage === 'result' && (
          <div className="relative flex items-center justify-center py-1">
            {isSuccess || !isFailed ? (
              <div className="flex flex-col items-center gap-2 animate-victory-burst">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/40 blur-xl animate-pulse" />
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-400 text-white flex items-center justify-center shadow-2xl ring-4 ring-emerald-400/40 relative z-10">
                    <CheckCircle2 size={48} className="stroke-[2.5]" />
                  </div>
                </div>
                <div className="text-center space-y-0.5">
                  <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                    OTP Verification Successful!
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold font-mono">
                    Digit Code: {otpCode || '123456'} • Cryptographic Match Confirmed
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 animate-shake-error">
                <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center shadow-2xl ring-4 ring-rose-500/30">
                  <XCircle size={40} />
                </div>
                <span className="text-xs font-black text-rose-500 uppercase tracking-wider">
                  Invalid Verification Code
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
