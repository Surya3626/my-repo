package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.JourneyTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JourneyTrackingRepository extends JpaRepository<JourneyTracking, Long> {
    Optional<JourneyTracking> findByMobileNumber(String mobileNumber);
}
