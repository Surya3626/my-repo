package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.entity.BroadbandPlan;

import java.util.List;

public interface PlanService {
    List<BroadbandPlan> getAllPlans();
    BroadbandPlan getPlanById(Long id);
    void seedPlans();
    Double validateCoupon(String couponCode, Double originalPrice);
}
