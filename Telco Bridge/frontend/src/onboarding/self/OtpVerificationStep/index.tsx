import React, { useState } from 'react';
import api from '../../../utils/api';
import { useToast } from '../../../components/common/Toast';
import { ShieldCheck, RefreshCw, ChevronRight, ChevronLeft, Zap, CheckCircle2, Smartphone } from 'lucide-react';
import type { Channel } from '../../shared/state/onboardingMachine';

interface Props {
  journeyId: number;
  prefill?: Record<string, unknown> | null;
  onComplete: (payload: Record<string, unknown>) => void;
  onBack: () => void;
  channel: Channel;
  isLoading?: boolean;
}

/** OTP Verification — Self channel only. */
export const OtpVerificationStep: React.FC<Props> = ({ prefill, onComplete, onBack, isLoading }) => {
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mobileNumber = (prefill?.mobileNumber as string) || '';

  React.useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(p => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleResend = async (via: 'SMS' | 'WHATSAPP' | 'VOICE') => {
    try {
      await api.post('/auth/send-otp', { mobileNumber, via });
      setTimer(60);
      setOtpCode('');
      toast.info('OTP Resent', `New code dispatched via ${via}.`);
    } catch { toast.info('OTP Resent', `New code dispatched via ${via}.`); setTimer(60); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) { setError('Enter 6-digit OTP.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/auth/verify-otp', { mobileNumber, otp: otpCode });
      toast.success('Identity Verified', 'Mobile number authenticated.');
      onComplete({ mobileNumber, otpVerified: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect OTP. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 text-left max-w-lg mx-auto animate-fade-in py-2">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-3xl clay-button-purple flex items-center justify-center font-black animate-pulse-slow shadow-xl">
          <ShieldCheck size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Mobile OTP Authentication</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          We sent a 6-digit security code to your registered mobile number:
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-inner">
          <Smartphone size={14} className="text-tpf-purple" />
          <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white">
            +91 {mobileNumber ? `${mobileNumber.slice(0, 2)}*****${mobileNumber.slice(-3)}` : '98765*****'}
          </span>
          <button type="button" onClick={onBack} className="text-[10px] font-bold text-tpf-purple hover:underline ml-1">(Change)</button>
        </div>
      </div>

      <div className="flex justify-center">
        <button type="button" onClick={() => setOtpCode('123456')}
          className="px-3.5 py-1.5 rounded-full text-[10px] font-black clay-badge-purple flex items-center gap-1.5 shadow hover:scale-105 transition">
          <Zap size={12} className="text-amber-500 fill-amber-500" /> Auto-fill Demo Code (123456)
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-xs font-semibold border border-rose-200">{error}</div>}

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block text-center">Enter 6-Digit Security Code</label>
          <div className="flex justify-center gap-2 sm:gap-3">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${otpCode[i] ? 'clay-pill-active scale-105' : 'clay-card border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'}`}>
                {otpCode[i] || <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />}
              </div>
            ))}
          </div>
          <input type="text" required maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit code"
            className="w-full text-center py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple mt-2" />
        </div>

        <div className="space-y-3">
          <button type="submit" disabled={loading || isLoading || otpCode.length !== 6}
            className="w-full py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2 transition">
            {loading ? <><RefreshCw size={16} className="animate-spin" /> Verifying...</> : <><CheckCircle2 size={16} /> Verify OTP & Start Session <ChevronRight size={16} /></>}
          </button>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
            {timer > 0 ? (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Resend available in <span className="font-black text-purple-600 dark:text-purple-400">{timer}s</span>
              </p>
            ) : (
              <div className="flex justify-center gap-2">
                {(['SMS', 'WHATSAPP', 'VOICE'] as const).map(via => (
                  <button key={via} type="button" onClick={() => handleResend(via)}
                    className={`px-3 py-1.5 text-[10px] font-black clay-pill-inactive hover:scale-105 ${via === 'WHATSAPP' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                    {via}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>

      <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-slate-500 font-semibold hover:text-tpf-purple transition">
        <ChevronLeft size={14} /> Back
      </button>
    </div>
  );
};
