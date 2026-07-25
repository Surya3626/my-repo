/**
 * journeyApi.ts
 *
 * All calls to the backend /api/onboarding/* and /api/address/* endpoints.
 * No component calls these endpoints directly — always go through this module.
 */
import api from '../../../utils/api';
import type { OnboardingJourney } from './types';
import type { Channel, OnboardingStep } from './onboardingMachine';

// ─── Journey lifecycle ────────────────────────────────────────────────────────

/** Start a new onboarding journey. Returns the created journey with journeyId. */
export async function startJourney(
  prospectMobile: string,
  channel: Channel,
  actorId?: string
): Promise<OnboardingJourney> {
  const res = await api.post('/onboarding/start', { prospectMobile, channel, actorId });
  return res.data.data as OnboardingJourney;
}

/** Get current journey state + full audit trail. */
export async function getJourney(journeyId: number): Promise<OnboardingJourney> {
  const res = await api.get(`/onboarding/${journeyId}`);
  return res.data.data as OnboardingJourney;
}

/** Mark a step as STARTED (call when user lands on a step screen). */
export async function startStep(
  journeyId: number,
  step: OnboardingStep,
  actorId?: string
): Promise<OnboardingJourney> {
  const res = await api.post(`/onboarding/${journeyId}/steps/${step}/start`, { actorId });
  return res.data.data as OnboardingJourney;
}

/** Mark a step as COMPLETED and advance currentStep. */
export async function completeStep(
  journeyId: number,
  step: OnboardingStep,
  payloadJson: string,
  actorId?: string
): Promise<OnboardingJourney> {
  const res = await api.post(`/onboarding/${journeyId}/steps/${step}/complete`, {
    payloadJson,
    actorId,
  });
  return res.data.data as OnboardingJourney;
}

/** Check if an active onboarding journey exists for a prospect mobile. */
export async function checkJourneyExists(
  prospectMobile: string
): Promise<{ exists: boolean; journeyId?: number; currentStep?: OnboardingStep; message?: string }> {
  try {
    const res = await api.get(`/onboarding/check?mobile=${prospectMobile}`);
    if (res.data?.success && res.data.data?.exists) {
      return {
        exists: true,
        journeyId: res.data.data.journeyId,
        currentStep: res.data.data.currentStep,
      };
    }
    return { exists: false, message: 'No active booking found for this mobile number.' };
  } catch (err: any) {
    return {
      exists: false,
      message: err.response?.data?.message || 'No active booking found for this mobile number.',
    };
  }
}

/** Resume: find the latest journey for a prospect mobile after OTP verification. */
export async function resumeJourney(prospectMobile: string): Promise<OnboardingJourney> {
  const res = await api.post('/onboarding/resume', { prospectMobile });
  return res.data.data as OnboardingJourney;
}

/** Abandon a journey (Sales Agent saves and exits). */
export async function abandonJourney(journeyId: number, actorId?: string): Promise<OnboardingJourney> {
  const res = await api.post(`/onboarding/${journeyId}/abandon`, { actorId });
  return res.data.data as OnboardingJourney;
}

// ─── Address lookups ─────────────────────────────────────────────────────────

let _statesCitiesCache: Record<string, string[]> | null = null;

/** Returns the states → cities map. Cached after first call. */
export async function getStatesCities(): Promise<Record<string, string[]>> {
  if (_statesCitiesCache) return _statesCitiesCache;
  const res = await api.get('/address/states-cities');
  _statesCitiesCache = res.data.data as Record<string, string[]>;
  return _statesCitiesCache!;
}

/** Lookup city and state for a pincode. Returns null if not found. */
export async function lookupPincode(
  pincode: string
): Promise<{ city: string; state: string } | null> {
  if (pincode.length !== 6) return null;
  try {
    const res = await api.get(`/address/lookup?pincode=${pincode}`);
    if (res.data?.success && res.data.data) {
      return res.data.data as { city: string; state: string };
    }
    return null;
  } catch {
    return null;
  }
}
