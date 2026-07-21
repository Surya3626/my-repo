package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.BroadbandPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BroadbandPlanRepository extends JpaRepository<BroadbandPlan, Long> {
}
