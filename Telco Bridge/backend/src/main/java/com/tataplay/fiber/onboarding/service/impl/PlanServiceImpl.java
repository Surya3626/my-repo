package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.entity.BroadbandPlan;
import com.tataplay.fiber.onboarding.repository.BroadbandPlanRepository;
import com.tataplay.fiber.onboarding.service.PlanService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanServiceImpl implements PlanService {

    private final BroadbandPlanRepository planRepository;

    @PostConstruct
    public void init() {
        seedPlans();
    }

    @Override
    public List<BroadbandPlan> getAllPlans() {
        return planRepository.findAll();
    }

    @Override
    public BroadbandPlan getPlanById(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found with ID: " + id));
    }

    @Override
    public void seedPlans() {
        if (planRepository.count() > 0) return;

        BroadbandPlan p1 = BroadbandPlan.builder()
                .name("Basic Fiber Starter")
                .speedMbps(50)
                .price(549.0)
                .validityDays(30)
                .description("Perfect starter pack for buffer-free browsing and Zoom meetings.")
                .installationCharges(500.0)
                .routerIncluded(true)
                .ottBenefits("None")
                .recommended(false)
                .build();

        BroadbandPlan p2 = BroadbandPlan.builder()
                .name("Super Premium Value")
                .speedMbps(100)
                .price(799.0)
                .validityDays(30)
                .description("Most popular plan for HD streaming, smart home devices, and work-from-home.")
                .installationCharges(0.0)
                .routerIncluded(true)
                .ottBenefits("Disney+ Hotstar, ZEE5, Hungama Play, ShemarooMe")
                .recommended(true)
                .build();

        BroadbandPlan p3 = BroadbandPlan.builder()
                .name("Entertainment Streamer Pro")
                .speedMbps(150)
                .price(999.0)
                .validityDays(30)
                .description("Best for 4K streaming and moderate gaming across 5+ devices.")
                .installationCharges(0.0)
                .routerIncluded(true)
                .ottBenefits("Amazon Prime Lite, Disney+ Hotstar, ZEE5, SonyLIV, JioCinema")
                .recommended(false)
                .build();

        BroadbandPlan p4 = BroadbandPlan.builder()
                .name("Gamer Ultra Pro Max")
                .speedMbps(300)
                .price(1499.0)
                .validityDays(30)
                .description("Super low latency connection designed for hardcore multiplayer gaming and heavy downloads.")
                .installationCharges(0.0)
                .routerIncluded(true)
                .ottBenefits("Netflix Basic, Amazon Prime, Disney+ Hotstar, SonyLIV, ZEE5")
                .recommended(false)
                .build();

        planRepository.saveAll(Arrays.asList(p1, p2, p3, p4));
    }

    @Override
    public Double validateCoupon(String couponCode, Double originalPrice) {
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return 0.0;
        }

        String code = couponCode.trim().toUpperCase();
        if ("WELCOME100".equals(code)) {
            return 100.0; // flat 100 Rs discount
        } else if ("FIBER50".equals(code)) {
            return 50.0; // flat 50 Rs discount
        } else if ("TATA10".equals(code)) {
            return originalPrice * 0.10; // 10% discount
        } else {
            throw new RuntimeException("Invalid or expired coupon code.");
        }
    }
}
