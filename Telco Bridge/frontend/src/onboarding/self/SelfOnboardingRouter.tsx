import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StepProgressBar } from '../shared/components/StepProgressBar';
import {
  getUiSteps,
  getNextUiStep,
  type OnboardingStep,
  type Channel,
} from '../shared/state/onboardingMachine';
import {
  startJourney,
  getJourney,
  startStep,
  completeStep,
  resumeJourney,
} from '../shared/state/journeyApi';
import type { OnboardingJourney } from '../shared/state/types';
import { parseStepPayload } from '../shared/state/types';

// Step components (lazy loaded)
import { FeasibilityCheckStep } from '../shared/steps/FeasibilityCheckStep';
import { CustomerDetailsStep } from '../shared/steps/CustomerDetailsStep';
import { OtpVerificationStep } from './OtpVerificationStep';
import { DocumentCollectionStep } from '../shared/steps/DocumentCollectionStep';
import { BuildProfileStep } from '../shared/steps/BuildProfileStep';
import { PlansAddonsCouponsStep } from '../shared/steps/PlansAddonsCouponsStep';
import { PaymentStep } from '../shared/steps/PaymentStep';
import { CustomerConsentStep } from '../shared/steps/CustomerConsentStep';
import { CafGenerationStep } from '../shared/steps/CafGenerationStep';
import { EkycInitiationStep } from '../shared/steps/EkycInitiationStep';

const CHANNEL: Channel = 'SELF';

/**
 * SelfOnboardingRouter
 *
 * Orchestrates the self-service onboarding flow. Responsibilities:
 * - Start / resume a journey via the backend API
 * - Render the correct step component for `currentStep`
 * - On step completion: call backend, advance to next UI step
 * - Drive the StepProgressBar with real state
 *
 * Step components receive only what they need:
 * - journeyId (to record audit)
 * - prefill payload (for resume hydration)
 * - onComplete(payload) callback
 * - onBack() callback
 *
 * This component does NOT contain any step business logic.
 */
export const SelfOnboardingRouter: React.FC = () => {
  const { token, customer } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { resumeMobile?: string; pincode?: string } | null;

  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('FEASIBILITY_CHECK');
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [isPostConsent, setIsPostConsent] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Init: start or resume a journey ───────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        let j: OnboardingJourney;
        const targetMobile = locationState?.resumeMobile 
          || localStorage.getItem('tpf_resume_mobile') 
          || customer?.mobileNumber 
          || '';

        if (targetMobile) {
          try {
            j = await resumeJourney(targetMobile);
            toast.success('Booking Session Active', `Continuing onboarding for ${targetMobile}.`);
          } catch {
            j = await startJourney(targetMobile, CHANNEL, targetMobile);
          }
        } else {
          j = await startJourney('', CHANNEL, '');
        }

        applyJourney(j);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to start onboarding session.');
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyJourney = (j: OnboardingJourney) => {
    setJourney(j);
    if (j.currentStep) {
      setCurrentStep(j.currentStep);
    } else if (j.status === 'COMPLETED') {
      setCurrentStep('EKYC_INITIATION');
      setShowCompletedModal(true);
    }
    if (j.status === 'COMPLETED') {
      setShowCompletedModal(true);
    }
    const done = j.auditTrail
      .filter(a => a.status === 'COMPLETED')
      .map(a => a.step);
    setCompletedSteps(done);
    setIsPostConsent(done.includes('CUSTOMER_CONSENT'));
  };



  // ─── Step navigation ────────────────────────────────────────────────────────

  const handleStepComplete = useCallback(async (payload: Record<string, unknown>) => {
    if (!journey) return;
    setLoading(true);
    setError('');
    try {
      const payloadJson = JSON.stringify(payload);
      const updated = await completeStep(journey.journeyId, currentStep, payloadJson, customer?.mobileNumber);
      applyJourney(updated);

      // Advance to next UI-visible step
      const next = getNextUiStep(CHANNEL, currentStep);
      if (next === 'COMPLETE') {
        toast.success('Onboarding Complete!', 'Your fiber connection has been booked.');
        navigate('/selfcare');
      } else {
        setCurrentStep(next);
        // Fire startStep for the new step
        await startStep(updated.journeyId, next, customer?.mobileNumber);
        // Dispatch step change for chatbot (notification only, chatbot cannot navigate steps)
        window.dispatchEvent(new CustomEvent('tpf_step_change', { detail: { step: next } }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save step. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [journey, currentStep, customer, navigate, toast]);

  const handleStepBack = useCallback(() => {
    if (!journey) return;
    const uiSteps = getUiSteps(CHANNEL);
    const idx = uiSteps.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(uiSteps[idx - 1]);
    }
  }, [journey, currentStep]);

  const handleStepperClick = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  // ─── Listen to chatbot actions (READ-ONLY — no navigation) ──────────────────

  useEffect(() => {
    const handleBotAction = (e: any) => {
      const { action, payload } = e.detail || {};
      // NAVIGATE_STEP removed — chatbot cannot jump steps directly
      // Only informational / form-fill actions are allowed:
      if (action === 'AUTOFILL' || action === 'SELECT_PLAN' || action === 'APPLY_COUPON') {
        // Relay to the active step component via a custom event it can listen to
        window.dispatchEvent(new CustomEvent('tpf_bot_autofill', { detail: { action, payload } }));
      }
    };
    window.addEventListener('tpf_bot_action', handleBotAction);
    return () => window.removeEventListener('tpf_bot_action', handleBotAction);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading && !journey) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-tpf-purple border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400 font-semibold text-sm">Initialising your onboarding session…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="clay-card p-8 space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Unable to Resume Application</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{error}</p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  const mobile = customer?.mobileNumber || '';
                  const j = await startJourney(mobile, CHANNEL, mobile);
                  applyJourney(j);
                } catch (e: any) {
                  setError(e.response?.data?.message || 'Failed to start onboarding session.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-3 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Start a New Application
            </button>
            <button
              type="button"
              onClick={() => navigate('/onboard/resume')}
              className="w-full py-2.5 clay-pill-inactive text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Return to Resume Lookup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allPrefill: Record<string, any> = {};
  if (journey?.stepPayloads) {
    Object.values(journey.stepPayloads).forEach(jsonStr => {
      if (jsonStr) {
        try {
          Object.assign(allPrefill, JSON.parse(jsonStr));
        } catch (_) {}
      }
    });
  }
  if (journey?.prospectMobile) {
    allPrefill.mobileNumber = journey.prospectMobile;
  }

  const currentStepPayload = journey ? parseStepPayload(journey, currentStep) : null;
  const prefill = { ...allPrefill, ...currentStepPayload };

  const stepProps = {
    journeyId: journey?.journeyId ?? 0,
    prefill: prefill,
    onComplete: handleStepComplete,
    onBack: handleStepBack,
    channel: CHANNEL,
    isLoading: loading,
  };


  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Customer save & exit strip */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-slate-400">TelcoBridge Self-Onboarding Portal</span>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-3.5 py-1.5 rounded-xl border dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Save & Exit
        </button>
      </div>

      {/* Step progress bar */}
      {journey && (
        <StepProgressBar
          channel={CHANNEL}
          currentStep={currentStep}
          completedSteps={completedSteps}
          journeyStatus={journey.status}
          isPostConsent={isPostConsent}
          onStepClick={handleStepperClick}
        />
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 text-xs font-semibold animate-shake">
          {error}
        </div>
      )}

      {/* Active step */}
      <div className="clay-card p-8 relative min-h-[400px] flex flex-col justify-between">
        {currentStep === 'FEASIBILITY_CHECK' && <FeasibilityCheckStep {...stepProps} />}
        {currentStep === 'CUSTOMER_DETAILS' && <CustomerDetailsStep {...stepProps} />}
        {currentStep === 'OTP_VERIFICATION' && <OtpVerificationStep {...stepProps} />}
        {currentStep === 'DOCUMENT_COLLECTION' && <DocumentCollectionStep {...stepProps} />}
        {currentStep === 'BUILD_PROFILE' && <BuildProfileStep {...stepProps} />}
        {currentStep === 'PLANS_ADDONS_COUPONS' && <PlansAddonsCouponsStep {...stepProps} />}
        {currentStep === 'PAYMENT' && <PaymentStep {...stepProps} />}
        {currentStep === 'CUSTOMER_CONSENT' && <CustomerConsentStep {...stepProps} />}
        {currentStep === 'CAF_GENERATION' && <CafGenerationStep {...stepProps} />}
        {currentStep === 'EKYC_INITIATION' && <EkycInitiationStep {...stepProps} />}
      </div>

      {/* Onboarding Completed Resumption Modal */}
      {showCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
          <div className="clay-modal p-8 max-w-lg w-full space-y-6 text-left border-2 border-purple-500/40 shadow-2xl relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-500/30">
              <CheckCircle2 size={32} />
            </div>
            
            <div className="space-y-2">
              <span className="clay-badge-emerald px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                JOURNEY COMPLETED & ACTIVE
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Onboarding Completed!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Your TelcoBridge Fiber broadband onboarding is 100% completed and your doorstep installation appointment is active. Please visit the SelfCare Portal for account management, plan upgrades, and live support tickets.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-1">
              <span className="font-extrabold text-tpf-purple block">Registered Account Mobile:</span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                +91-{journey?.prospectMobile || customer?.mobileNumber || 'Subscriber'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/selfcare')}
                className="w-full sm:w-1/2 py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                🚀 Go to SelfCare Portal
              </button>

              <button
                type="button"
                onClick={() => setShowCompletedModal(false)}
                className="w-full sm:w-1/2 py-3.5 clay-button-slate text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                🛠️ Field Engineering Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

