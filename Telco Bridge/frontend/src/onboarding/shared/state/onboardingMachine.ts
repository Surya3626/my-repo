/**
 * onboardingMachine.ts
 *
 * Single source of truth for step ordering and flow navigation.
 * NO component should compute "what step is next" with inline if/else.
 * Always call through this module.
 */

export type OnboardingStep =
  | 'FEASIBILITY_CHECK'
  | 'CUSTOMER_DETAILS'
  | 'OTP_VERIFICATION'
  | 'DOCUMENT_COLLECTION'
  | 'BUILD_PROFILE'
  | 'PLANS_ADDONS_COUPONS'
  | 'PAYMENT'
  | 'DOCUMENT_MIGRATION'   // Backend-only; router skips rendering it
  | 'CUSTOMER_CONSENT'
  | 'CAF_GENERATION'
  | 'EKYC_INITIATION';

export type Channel = 'SELF' | 'SALES_AGENT';

export type JourneyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

// ─── Step metadata ──────────────────────────────────────────────────────────

export interface StepMeta {
  step: OnboardingStep;
  label: string;
  shortLabel: string;
  description: string;
  hasUi: boolean; // false for DOCUMENT_MIGRATION
}

export const STEP_META: Record<OnboardingStep, StepMeta> = {
  FEASIBILITY_CHECK: {
    step: 'FEASIBILITY_CHECK',
    label: 'Verify Coverage Feasibility',
    shortLabel: 'Feasibility',
    description: 'Check fiber optic coverage at your address',
    hasUi: true,
  },
  CUSTOMER_DETAILS: {
    step: 'CUSTOMER_DETAILS',
    label: 'Connection Booking Details',
    shortLabel: 'Booking',
    description: 'Register your contact and entity details',
    hasUi: true,
  },
  OTP_VERIFICATION: {
    step: 'OTP_VERIFICATION',
    label: 'Mobile OTP Verification',
    shortLabel: 'OTP',
    description: 'Verify your mobile number with a one-time password',
    hasUi: true, // only rendered in SELF channel
  },
  DOCUMENT_COLLECTION: {
    step: 'DOCUMENT_COLLECTION',
    label: 'Document Upload & E-KYC',
    shortLabel: 'Docs',
    description: 'Upload identity and address proof documents',
    hasUi: true,
  },
  BUILD_PROFILE: {
    step: 'BUILD_PROFILE',
    label: 'Billing Address & Profile',
    shortLabel: 'Profile',
    description: 'Configure billing address and enterprise profile',
    hasUi: true,
  },
  PLANS_ADDONS_COUPONS: {
    step: 'PLANS_ADDONS_COUPONS',
    label: 'Plan & Add-on Selection',
    shortLabel: 'Plans',
    description: 'Choose your broadband plan, add-ons, and apply coupons',
    hasUi: true,
  },
  PAYMENT: {
    step: 'PAYMENT',
    label: 'Payment & Order Summary',
    shortLabel: 'Payment',
    description: 'Complete payment for your selected plan',
    hasUi: true,
  },
  DOCUMENT_MIGRATION: {
    step: 'DOCUMENT_MIGRATION',
    label: 'Document Migration',
    shortLabel: 'Migration',
    description: 'Backend-only: documents migrated to central store',
    hasUi: false, // No UI — handled automatically on PAYMENT completion
  },
  CUSTOMER_CONSENT: {
    step: 'CUSTOMER_CONSENT',
    label: 'Customer Consent & E-Signature',
    shortLabel: 'Consent',
    description: 'Review disclosures and provide digital consent',
    hasUi: true,
  },
  CAF_GENERATION: {
    step: 'CAF_GENERATION',
    label: 'CAF Generation',
    shortLabel: 'CAF',
    description: 'Generate your Customer Application Form',
    hasUi: true,
  },
  EKYC_INITIATION: {
    step: 'EKYC_INITIATION',
    label: 'E-KYC & Installation Scheduling',
    shortLabel: 'EKYC',
    description: 'Schedule field engineer visit for E-KYC and installation',
    hasUi: true,
  },
};

// ─── Canonical step orders ───────────────────────────────────────────────────

const SELF_ORDER: OnboardingStep[] = [
  'FEASIBILITY_CHECK',
  'CUSTOMER_DETAILS',
  'OTP_VERIFICATION',
  'DOCUMENT_COLLECTION',
  'BUILD_PROFILE',
  'PLANS_ADDONS_COUPONS',
  'PAYMENT',
  'DOCUMENT_MIGRATION',
  'CUSTOMER_CONSENT',
  'CAF_GENERATION',
  'EKYC_INITIATION',
];

const SALES_AGENT_ORDER: OnboardingStep[] = [
  'FEASIBILITY_CHECK',
  'CUSTOMER_DETAILS',
  // OTP_VERIFICATION is skipped for SALES_AGENT
  'DOCUMENT_COLLECTION',
  'BUILD_PROFILE',
  'PLANS_ADDONS_COUPONS',
  'PAYMENT',
  'DOCUMENT_MIGRATION',
  'CUSTOMER_CONSENT',
  'CAF_GENERATION',
  'EKYC_INITIATION',
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the full ordered list of steps for a channel.
 */
export function getStepOrder(channel: Channel): OnboardingStep[] {
  return channel === 'SALES_AGENT' ? [...SALES_AGENT_ORDER] : [...SELF_ORDER];
}

/**
 * Returns only the steps that have a UI (i.e. DOCUMENT_MIGRATION excluded).
 * Use this to render the stepper progress bar.
 */
export function getUiSteps(channel: Channel): OnboardingStep[] {
  return getStepOrder(channel).filter(s => STEP_META[s].hasUi);
}

/**
 * Returns the next step after `current` for the given channel.
 * Returns 'COMPLETE' if `current` was the last step.
 */
export function getNextStep(channel: Channel, current: OnboardingStep): OnboardingStep | 'COMPLETE' {
  const order = getStepOrder(channel);
  const idx = order.indexOf(current);
  if (idx === -1 || idx === order.length - 1) return 'COMPLETE';
  return order[idx + 1];
}

/**
 * Returns the previous step before `current` for the given channel.
 * Returns null if `current` is the first step.
 */
export function getPrevStep(channel: Channel, current: OnboardingStep): OnboardingStep | null {
  const order = getStepOrder(channel);
  const idx = order.indexOf(current);
  if (idx <= 0) return null;
  return order[idx - 1];
}

/**
 * Returns the next UI-visible step (skipping DOCUMENT_MIGRATION which is backend-only).
 * Routers use this to advance the displayed step after PAYMENT completes.
 */
export function getNextUiStep(channel: Channel, current: OnboardingStep): OnboardingStep | 'COMPLETE' {
  let next = getNextStep(channel, current);
  // Skip backend-only steps
  while (next !== 'COMPLETE' && !STEP_META[next].hasUi) {
    next = getNextStep(channel, next);
  }
  return next;
}

/**
 * Check whether the user can navigate to a target step given which steps are already completed.
 * Used by the stepper — completed steps can be jumped back to (unless post-consent lock applies).
 */
export function canNavigateTo(
  channel: Channel,
  journeyStatus: JourneyStatus,
  targetStep: OnboardingStep,
  completedSteps: OnboardingStep[],
  isPostConsent: boolean
): boolean {
  if (journeyStatus === 'COMPLETED') return false;
  if (!STEP_META[targetStep].hasUi) return false;

  // After CUSTOMER_CONSENT is completed, no backward navigation allowed
  if (isPostConsent) {
    const consentIdx = getStepOrder(channel).indexOf('CUSTOMER_CONSENT');
    const targetIdx = getStepOrder(channel).indexOf(targetStep);
    if (targetIdx <= consentIdx) return false;
  }

  return completedSteps.includes(targetStep);
}

/**
 * Return the 1-based display position of a UI step (for "Step X of Y" labels).
 * DOCUMENT_MIGRATION is excluded from the count since it has no UI.
 */
export function getUiStepIndex(channel: Channel, step: OnboardingStep): number {
  return getUiSteps(channel).indexOf(step) + 1;
}

/**
 * Total number of UI-visible steps for a channel.
 */
export function getTotalUiSteps(channel: Channel): number {
  return getUiSteps(channel).length;
}
