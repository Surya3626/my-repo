import type { OnboardingStep, Channel, JourneyStatus } from './onboardingMachine';

/** Audit row for a single step transition */
export interface StepAuditEntry {
  id: number;
  step: OnboardingStep;
  status: 'STARTED' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  performedByType: 'CUSTOMER' | 'SALES_AGENT' | 'SYSTEM';
  performedById: string;
  performedAt: string; // ISO8601
  payloadSnapshot: string | null;
}

/** Full journey state returned by the backend */
export interface OnboardingJourney {
  journeyId: number;
  prospectMobile: string;
  channel: Channel;
  currentStep: OnboardingStep | null; // null means COMPLETED
  status: JourneyStatus;
  lastActorId: string;
  lastActorType: 'CUSTOMER' | 'SALES_AGENT' | 'SYSTEM';
  createdAt: string;
  updatedAt: string;
  auditTrail: StepAuditEntry[];
  /** Map of step → last completed payload JSON string */
  stepPayloads: Partial<Record<OnboardingStep, string>>;
}

/** Parsed step payload for form hydration */
export type StepPayload = Record<string, unknown>;

/**
 * Parse a step's saved payload JSON.
 * Returns null if the step has no saved payload.
 */
export function parseStepPayload(journey: OnboardingJourney, step: OnboardingStep): StepPayload | null {
  const raw = journey.stepPayloads[step];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
