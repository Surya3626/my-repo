import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/common/Toast';
import { AdminModeTopBar } from '../shared/components/AdminModeTopBar';
import { StepProgressBar } from '../shared/components/StepProgressBar';
import { StepTransitionOverlay } from '../shared/components/StepTransitionOverlay';
import {
  getUiSteps,
  getNextUiStep,
  getUiStepIndex,
  getTotalUiSteps,
  type OnboardingStep,
  type Channel,
} from '../shared/state/onboardingMachine';
import {
  startJourney,
  startStep,
  completeStep,
  abandonJourney,
} from '../shared/state/journeyApi';
import type { OnboardingJourney } from '../shared/state/types';
import { parseStepPayload } from '../shared/state/types';

// Step components
import { FeasibilityCheckStep } from '../shared/steps/FeasibilityCheckStep';
import { CustomerDetailsStep } from '../shared/steps/CustomerDetailsStep';
import { DocumentCollectionStep } from '../shared/steps/DocumentCollectionStep';
import { BuildProfileStep } from '../shared/steps/BuildProfileStep';
import { PlansAddonsCouponsStep } from '../shared/steps/PlansAddonsCouponsStep';
import { PaymentStep } from '../shared/steps/PaymentStep';
import { CustomerConsentStep } from '../shared/steps/CustomerConsentStep';
import { CafGenerationStep } from '../shared/steps/CafGenerationStep';
import { EkycInitiationStep } from '../shared/steps/EkycInitiationStep';

const CHANNEL: Channel = 'SALES_AGENT';

interface LocationState {
  agentId?: string;
  adminId?: string;
  customerMobile?: string;
  prospectData?: { firstName?: string; lastName?: string; email?: string };
}

/**
 * SalesAgentOnboardingRouter
 *
 * Orchestrates the Sales Agent (formerly "SOC Admin") onboarding flow.
 *
 * Key differences from SelfOnboardingRouter:
 * - OTP_VERIFICATION step is absent (handled by SALES_AGENT channel order in state machine)
 * - Shows AdminModeTopBar with agent identity
 * - Has "Save & Leave" (abandon) instead of "Save & Exit"
 * - Agent can stop at any completed step — customer resumes from that point via self portal
 */
export const SalesAgentOnboardingRouter: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const agentId = locationState?.agentId || locationState?.adminId ||
    localStorage.getItem('tpf_admin_username') || 'agent';
  const customerMobile = locationState?.customerMobile || '';

  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('FEASIBILITY_CHECK');
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [isPostConsent, setIsPostConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // ─── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const j = await startJourney(customerMobile, CHANNEL, agentId);
        applyJourney(j);
        // Fire startStep for first step
        await startStep(j.journeyId, j.currentStep!, agentId);
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
    }
    const done = j.auditTrail.filter(a => a.status === 'COMPLETED').map(a => a.step);
    setCompletedSteps(done);
    setIsPostConsent(done.includes('CUSTOMER_CONSENT'));
  };


  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const [transitionNextStep, setTransitionNextStep] = useState<OnboardingStep>('CUSTOMER_DETAILS');

  // ─── Step navigation ────────────────────────────────────────────────────────

  const handleStepComplete = useCallback(async (payload: Record<string, unknown>) => {
    if (!journey) return;
    setLoading(true);
    setError('');

    const next = getNextUiStep(CHANNEL, currentStep);
    if (next !== 'COMPLETE') {
      setTransitionNextStep(next);
      setShowTransitionOverlay(true);
    }

    try {
      const updated = await completeStep(
        journey.journeyId, currentStep, JSON.stringify(payload), agentId
      );
      
      // Brief animated delay for step transition overlay
      await new Promise(r => setTimeout(r, 1100));

      applyJourney(updated);

      if (next === 'COMPLETE') {
        toast.success('Onboarding Complete!', 'Customer journey fully completed.');
        navigate('/admin');
      } else {
        setCurrentStep(next);
        await startStep(updated.journeyId, next, agentId);
        window.dispatchEvent(new CustomEvent('tpf_step_change', { detail: { step: next } }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save step.');
    } finally {
      setLoading(false);
      setShowTransitionOverlay(false);
    }
  }, [journey, currentStep, agentId, navigate, toast]);

  const handleStepBack = useCallback(() => {
    if (!journey) return;
    const uiSteps = getUiSteps(CHANNEL);
    const idx = uiSteps.indexOf(currentStep);
    if (idx > 0) setCurrentStep(uiSteps[idx - 1]);
  }, [journey, currentStep]);

  const handleStepperClick = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const handleSaveAndExit = useCallback(async () => {
    if (!journey) { navigate('/admin'); return; }
    setIsSaving(true);
    try {
      await abandonJourney(journey.journeyId, agentId);
      toast.success('Progress Saved', 'Customer can resume from this step via the self-onboarding portal.');
      navigate('/admin');
    } catch {
      // Even on error, navigate — journey is still persisted
      navigate('/admin');
    } finally {
      setIsSaving(false);
    }
  }, [journey, agentId, navigate, toast]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading && !journey) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-tpf-purple border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-400 font-semibold text-sm">Initialising Sales Agent onboarding session…</p>
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
    agentId,
  };


  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* 🔮 Unique Animated Holographic Step Transition Overlay */}
      <StepTransitionOverlay
        isVisible={showTransitionOverlay}
        fromStep={currentStep}
        toStep={transitionNextStep}
        currentIndex={getUiStepIndex(CHANNEL, transitionNextStep)}
        totalSteps={getTotalUiSteps(CHANNEL)}
      />

      {/* Sales Agent Mode Top Bar */}
      <AdminModeTopBar
        agentId={agentId}
        customerMobile={customerMobile}
        onSaveAndExit={handleSaveAndExit}
        isSaving={isSaving}
      />

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

      {/* Active step container — OTP_VERIFICATION absent in SALES_AGENT channel */}
      <div key={currentStep} className="clay-card p-8 relative min-h-[400px] flex flex-col justify-between animate-slide-right overflow-hidden shadow-2xl">
        {/* 🚀 Quantum Warp Step Transition Conduit Beam */}
        {loading && (
          <div className="absolute top-0 inset-x-0 h-2 bg-slate-950 overflow-hidden z-30 flex items-center">
            <div className="h-full w-full bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 animate-fiber-beam shadow-[0_0_15px_#a855f7]" />
          </div>
        )}

        {currentStep === 'FEASIBILITY_CHECK' && <FeasibilityCheckStep {...stepProps} />}
        {currentStep === 'CUSTOMER_DETAILS' && <CustomerDetailsStep {...stepProps} />}
        {currentStep === 'DOCUMENT_COLLECTION' && <DocumentCollectionStep {...stepProps} />}
        {currentStep === 'BUILD_PROFILE' && <BuildProfileStep {...stepProps} />}
        {currentStep === 'PLANS_ADDONS_COUPONS' && <PlansAddonsCouponsStep {...stepProps} />}
        {currentStep === 'PAYMENT' && <PaymentStep {...stepProps} />}
        {currentStep === 'CUSTOMER_CONSENT' && (
          <CustomerConsentStep {...stepProps} isSalesAgentMode agentConsentRequired />
        )}
        {currentStep === 'CAF_GENERATION' && <CafGenerationStep {...stepProps} />}
        {currentStep === 'EKYC_INITIATION' && <EkycInitiationStep {...stepProps} />}
      </div>
    </div>
  );
};
