package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.entity.BroadbandPlan;
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
    public ResponseEntity<ApiResponse<List<BroadbandPlan>>> listPlans() {
        List<BroadbandPlan> plans = planService.getAllPlans();
        return ResponseEntity.ok(ApiResponse.success("Broadband plans retrieved successfully", plans));
    }

    @GetMapping("/coupon/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateCoupon(
            @RequestParam String code,
            @RequestParam Double price) {

        Double discount = planService.validateCoupon(code, price);
        Double finalPrice = price - discount;

        Map<String, Object> data = new HashMap<>();
        data.put("coupon", code);
        data.put("discount", discount);
        data.put("finalPrice", finalPrice);

        return ResponseEntity.ok(ApiResponse.success("Coupon code is valid", data));
    }
}
