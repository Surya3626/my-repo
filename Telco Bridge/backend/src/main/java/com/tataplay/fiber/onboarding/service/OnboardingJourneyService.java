package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.dto.OnboardingJourneyDto;
import com.tataplay.fiber.onboarding.entity.OnboardingChannel;
import com.tataplay.fiber.onboarding.entity.OnboardingStep;
import com.tataplay.fiber.onboarding.entity.PerformedByType;

/**
 * Wraps each onboarding step's business logic service and writes append-only audit rows.
 * This service does NOT absorb step business logic — it delegates to existing service classes.
 */
public interface OnboardingJourneyService {

    /**
     * Create a new onboarding journey for a prospect.
     * Writes a STARTED audit row for the first step.
     */
    OnboardingJourneyDto startJourney(String prospectMobile, OnboardingChannel channel,
                                     PerformedByType actorType, String actorId);

    /**
     * Write a STARTED audit row for a step.
     * Call this when the user lands on a step screen.
     */
    OnboardingJourneyDto startStep(Long journeyId, OnboardingStep step,
                                  PerformedByType actorType, String actorId);

    /**
     * Write a COMPLETED audit row; advance currentStep to the next incomplete step.
     * For SALES_AGENT channel, OTP_VERIFICATION is automatically SKIPPED.
     * For PAYMENT, DOCUMENT_MIGRATION is automatically STARTED + COMPLETED (SYSTEM).
     */
    OnboardingJourneyDto completeStep(Long journeyId, OnboardingStep step,
                                     PerformedByType actorType, String actorId,
                                     String payloadJson);

    /**
     * Write a SKIPPED audit row (e.g. OTP in SALES_AGENT channel).
     */
    OnboardingJourneyDto skipStep(Long journeyId, OnboardingStep step,
                                  PerformedByType actorType, String actorId);

    /**
     * Write a FAILED audit row (e.g. OTP verification failed, doc rejected).
     */
    OnboardingJourneyDto failStep(Long journeyId, OnboardingStep step,
                                  PerformedByType actorType, String actorId,
                                  String reason);

    /**
     * Mark the journey ABANDONED (agent saved and exited).
     * Does not delete the journey — customer can resume.
     */
    OnboardingJourneyDto abandonJourney(Long journeyId, PerformedByType actorType, String actorId);

    /**
     * Get the full journey state + audit trail + step payloads for a journey ID.
     */
    OnboardingJourneyDto getJourney(Long journeyId);

    /**
     * Resume: find the latest non-completed journey for a prospect mobile,
     * return its state + all step payloads for form hydration.
     */
    OnboardingJourneyDto resumeByMobile(String prospectMobile);
}
