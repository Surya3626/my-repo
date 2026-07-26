import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import { checkJourneyExists } from '../shared/state/journeyApi';
import { Smartphone, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, PlusCircle, Zap } from 'lucide-react';
import { OtpVortexAnimator } from '../../components/features/OtpVortexAnimator';

/**
 * ResumeLookup
 *
 * Lets a customer look up their existing onboarding journey by mobile number + OTP.
 * After verification, redirects to SelfOnboardingRouter with resumeMobile in state.
 *
 * Strictly guards against unregistered numbers:
 * - Checks whether an active OnboardingJourney exists BEFORE sending OTP.
 * - Displays a clear "No active booking found" state with a direct button to start a fresh application.
 */
export const ResumeLookup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const prefillMobile = params.get('mobile') || '';

  const [mobile, setMobile] = useState(prefillMobile);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [noJourneyFound, setNoJourneyFound] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError('');
    setNoJourneyFound(false);
    setLoading(true);

    try {
      // 1. Explicit pre-check: verify an active journey exists BEFORE sending OTP
      const check = await checkJourneyExists(mobile);
      if (!check.exists) {
        setNoJourneyFound(true);
        setLoading(false);
        return;
      }

      // 2. Journey exists: dispatch OTP
      await api.post('/auth/send-otp', { mobileNumber: mobile });
      setOtpSent(true);
      toast.success('OTP Sent', `A 6-digit code has been sent to ${mobile}.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check journey status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setError('');
    setLoading(true);
    setIsVerifyingOtp(true);

    setTimeout(async () => {
      try {
        const res = await api.post('/auth/verify-otp', { mobileNumber: mobile, otp });
        if (res.data?.success) {
          // Confirm journey still exists before redirecting
          const check = await checkJourneyExists(mobile);
          if (!check.exists) {
            setNoJourneyFound(true);
            return;
          }

          if ((check as any).status === 'COMPLETED') {
            toast.success('Onboarding Completed!', 'Your connection is active. Redirecting to SelfCare...');
            navigate('/selfcare');
            return;
          }

          toast.success('Verified!', 'Resuming your booking...');
          navigate('/onboard', { state: { resumeMobile: mobile } });
        } else {
          setError('Invalid OTP. Please try again.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'OTP verification failed.');
      } finally {
        setLoading(false);
        setIsVerifyingOtp(false);
      }
    }, 1400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 px-4">
      <div className="w-full max-w-md clay-card p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tpf-purple to-tpf-pink flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
            <Smartphone size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Resume Your Booking</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Enter your registered mobile number to continue from where you left off.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-semibold border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {/* Distinct No Journey Found Card */}
        {noJourneyFound ? (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/50 space-y-4 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">No Active Application Found</h3>
              <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
                We couldn't find an existing in-progress application for <strong className="text-amber-700 dark:text-amber-300">+91 {mobile}</strong>.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/onboard')}
                className="w-full py-3 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <PlusCircle size={16} /> Start a New Application
              </button>
              <button
                type="button"
                onClick={() => { setNoJourneyFound(false); setMobile(''); setError(''); }}
                className="w-full py-2.5 clay-pill-inactive text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Try a Different Mobile Number
              </button>
            </div>
          </div>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Registered Mobile Number
              </label>
              <input
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="E.g., 9876543210"
                className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-tpf-purple tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="w-full py-3 rounded-xl font-extrabold text-sm text-white gradient-bg flex items-center justify-center gap-2 shadow disabled:opacity-40 transition"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
              Lookup & Send OTP <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 size={14} />
              OTP sent to +91 {mobile}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setOtp('123456')}
                className="px-3.5 py-1.5 rounded-full text-[10px] font-black clay-badge-purple flex items-center gap-1.5 shadow hover:scale-105 transition"
              >
                <Zap size={12} className="text-amber-500 fill-amber-500" /> Auto-fill Demo Code (123456)
              </button>
            </div>

            <OtpVortexAnimator
              otpCode={otp}
              onChange={(code) => setOtp(code)}
              isValidating={isVerifyingOtp}
              label="6-Digit Authorization Code"
              sublabel={`Code dispatched to +91 ${mobile}`}
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 transition"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
              Verify & Resume Booking <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
              className="w-full text-xs text-slate-500 hover:text-tpf-purple font-semibold transition text-center block"
            >
              ← Change Mobile Number
            </button>
          </form>
        )}

        {/* New booking link */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have a booking?{' '}
          <button
            type="button"
            onClick={() => navigate('/onboard')}
            className="text-tpf-purple font-extrabold hover:underline"
          >
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );
};
