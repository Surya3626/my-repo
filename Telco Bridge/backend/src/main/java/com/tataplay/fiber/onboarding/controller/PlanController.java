package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.dto.PlanRecommendationRequest;
import com.tataplay.fiber.onboarding.entity.AddonItem;
import com.tataplay.fiber.onboarding.entity.BroadbandPlan;
import com.tataplay.fiber.onboarding.entity.Coupon;
import com.tataplay.fiber.onboarding.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BroadbandPlan>>> listPlans(
            @RequestParam(required = false) String segment) {
        List<BroadbandPlan> plans = (segment != null && !segment.trim().isEmpty())
                ? planService.getPlansBySegment(segment)
                : planService.getAllPlans();
        return ResponseEntity.ok(ApiResponse.success("Broadband plans retrieved successfully", plans));
    }

    @GetMapping("/addons")
    public ResponseEntity<ApiResponse<List<AddonItem>>> listAddons() {
        List<AddonItem> addons = planService.getAllAddons();
        return ResponseEntity.ok(ApiResponse.success("Value-added services retrieved", addons));
    }

    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<List<Coupon>>> listCoupons() {
        List<Coupon> coupons = planService.getActiveCoupons();
        return ResponseEntity.ok(ApiResponse.success("Active promo coupons retrieved", coupons));
    }

    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<BroadbandPlan>> recommendPlan(
            @RequestBody PlanRecommendationRequest request) {
        BroadbandPlan recommended = planService.recommendPlan(request);
        return ResponseEntity.ok(ApiResponse.success("Recommended plan generated", recommended));
    }

    @GetMapping("/coupon/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCoupon(
            @RequestParam String code,
            @RequestParam Double price,
            @RequestParam(required = false, defaultValue = "ALL") String segment) {

        Double discount = planService.validateCouponForSegment(code, price, segment);
        Double finalPrice = Math.max(0.0, price - discount);

        Map<String, Object> data = new HashMap<>();
        data.put("coupon", code.toUpperCase());
        data.put("discount", discount);
        data.put("finalPrice", finalPrice);

        return ResponseEntity.ok(ApiResponse.success("Coupon code applied successfully", data));
    }
}
