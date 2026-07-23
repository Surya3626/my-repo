package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.dto.PlanRecommendationRequest;
import com.tataplay.fiber.onboarding.entity.AddonItem;
import com.tataplay.fiber.onboarding.entity.BroadbandPlan;
import com.tataplay.fiber.onboarding.entity.Coupon;

import java.util.List;

public interface PlanService {
    List<BroadbandPlan> getAllPlans();
    List<BroadbandPlan> getPlansBySegment(String segment);
    BroadbandPlan getPlanById(Long id);
    List<AddonItem> getAllAddons();
    List<Coupon> getActiveCoupons();
    BroadbandPlan recommendPlan(PlanRecommendationRequest request);
    Double validateCoupon(String couponCode, Double originalPrice);
    Double validateCouponForSegment(String couponCode, Double originalPrice, String segment);
    Double calculateSafeDiscount(String couponCode, Double originalPrice, String segment);
    void seedPlans();
}
