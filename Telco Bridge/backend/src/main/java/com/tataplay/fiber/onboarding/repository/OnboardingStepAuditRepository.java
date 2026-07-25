package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.OnboardingJourney;
import com.tataplay.fiber.onboarding.entity.OnboardingStep;
import com.tataplay.fiber.onboarding.entity.OnboardingStepAudit;
import com.tataplay.fiber.onboarding.entity.StepAuditStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingStepAuditRepository extends JpaRepository<OnboardingStepAudit, Long> {

    /** All audit rows for a journey, ordered chronologically. */
    List<OnboardingStepAudit> findByJourneyOrderByPerformedAtAsc(OnboardingJourney journey);

    /** Latest COMPLETED audit row for a specific step (for payload resume). */
    Optional<OnboardingStepAudit> findTopByJourneyAndStepAndStatusOrderByPerformedAtDesc(
            OnboardingJourney journey, OnboardingStep step, StepAuditStatus status);
}
