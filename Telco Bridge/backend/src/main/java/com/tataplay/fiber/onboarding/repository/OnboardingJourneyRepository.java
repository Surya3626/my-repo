package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.JourneyStatus;
import com.tataplay.fiber.onboarding.entity.OnboardingJourney;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingJourneyRepository extends JpaRepository<OnboardingJourney, Long> {

    /** Find the most recent active (non-completed, non-abandoned) journey for a prospect. */
    Optional<OnboardingJourney> findTopByProspectMobileOrderByCreatedAtDesc(String prospectMobile);

    /** Find all journeys for a prospect (for history view). */
    List<OnboardingJourney> findByProspectMobileOrderByCreatedAtDesc(String prospectMobile);

    /** Find all journeys with a given status (e.g. for agent dashboard). */
    List<OnboardingJourney> findByStatus(JourneyStatus status);
}
