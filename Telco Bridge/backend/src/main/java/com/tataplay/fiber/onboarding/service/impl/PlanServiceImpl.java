package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.dto.PlanRecommendationRequest;
import com.tataplay.fiber.onboarding.entity.AddonItem;
import com.tataplay.fiber.onboarding.entity.BroadbandPlan;
import com.tataplay.fiber.onboarding.entity.Coupon;
import com.tataplay.fiber.onboarding.repository.AddonItemRepository;
import com.tataplay.fiber.onboarding.repository.BroadbandPlanRepository;
import com.tataplay.fiber.onboarding.repository.CouponRepository;
import com.tataplay.fiber.onboarding.service.PlanService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlanServiceImpl implements PlanService {

    private final BroadbandPlanRepository planRepository;
    private final AddonItemRepository addonItemRepository;
    private final CouponRepository couponRepository;

    @PostConstruct
    public void init() {
        seedPlans();
        seedAddons();
        seedCoupons();
    }

    @Override
    public List<BroadbandPlan> getAllPlans() {
        List<BroadbandPlan> list = planRepository.findAll();
        if (list.isEmpty()) {
            seedPlans();
            list = planRepository.findAll();
        }
        return list;
    }

    @Override
    public List<BroadbandPlan> getPlansBySegment(String segment) {
        List<BroadbandPlan> all = getAllPlans();
        if (segment == null || segment.trim().isEmpty() || "ALL".equalsIgnoreCase(segment)) {
            return all;
        }
        String seg = segment.trim().toUpperCase();
        List<BroadbandPlan> filtered = all.stream()
                .filter(p -> "BOTH".equalsIgnoreCase(p.getTargetSegment()) || seg.equalsIgnoreCase(p.getTargetSegment()))
                .toList();
        return filtered.isEmpty() ? all : filtered;
    }

    @Override
    public BroadbandPlan getPlanById(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found with ID: " + id));
    }

    @Override
    public List<AddonItem> getAllAddons() {
        return addonItemRepository.findByActiveTrue();
    }

    @Override
    public List<Coupon> getActiveCoupons() {
        return couponRepository.findByActiveTrue();
    }

    @Override
    public BroadbandPlan recommendPlan(PlanRecommendationRequest request) {
        List<BroadbandPlan> availablePlans = getPlansBySegment(request.getCustomerCategory());
        if (availablePlans.isEmpty()) {
            return availablePlans.get(0);
        }

        int devices = request.getDeviceCount() != null ? request.getDeviceCount() : 3;
        String usage = request.getPrimaryUsage() != null ? request.getPrimaryUsage().toUpperCase() : "GENERAL";

        int targetSpeed = 100;
        if ("GAMING".equals(usage) || devices > 10) {
            targetSpeed = 300;
        } else if ("STREAMING_4K".equals(usage) || devices > 5) {
            targetSpeed = 150;
        } else if ("WFH".equals(usage) || devices > 3) {
            targetSpeed = 100;
        } else {
            targetSpeed = 50;
        }

        final int speed = targetSpeed;
        return availablePlans.stream()
                .filter(p -> p.getSpeedMbps() >= speed)
                .findFirst()
                .orElse(availablePlans.get(availablePlans.size() - 1));
    }

    @Override
    public Double validateCoupon(String couponCode, Double originalPrice) {
        return validateCouponForSegment(couponCode, originalPrice, "ALL");
    }

    @Override
    public Double validateCouponForSegment(String couponCode, Double originalPrice, String segment) {
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return 0.0;
        }

        String code = couponCode.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .orElse(null);

        if (coupon == null) {
            // Fallback hardcoded validation for legacy coupons
            if ("WELCOME100".equals(code)) return 100.0;
            if ("FIBER50".equals(code)) return 50.0;
            if ("TATA10".equals(code)) return originalPrice * 0.10;
            if ("ANNUAL20".equals(code)) {
                if (originalPrice < 4000.0) {
                    throw new RuntimeException("Coupon ANNUAL20 requires an annual plan or minimum order of ₹4000.0.");
                }
                return originalPrice * 0.20;
            }
            throw new RuntimeException("Invalid or expired coupon code.");
        }

        if (coupon.getMinOrderAmount() != null && originalPrice < coupon.getMinOrderAmount()) {
            throw new RuntimeException("Minimum order amount of ₹" + coupon.getMinOrderAmount() + " required for coupon " + code);
        }

        if (coupon.getApplicableSegment() != null && !"ALL".equalsIgnoreCase(coupon.getApplicableSegment())) {
            if (segment != null && !coupon.getApplicableSegment().equalsIgnoreCase(segment) && !"ALL".equalsIgnoreCase(segment)) {
                throw new RuntimeException("Coupon " + code + " is applicable only for " + coupon.getApplicableSegment() + " customers.");
            }
        }

        Double discount = 0.0;
        if ("FLAT".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = coupon.getDiscountValue();
        } else if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = originalPrice * (coupon.getDiscountValue() / 100.0);
            if (coupon.getMaxDiscountAmount() != null && discount > coupon.getMaxDiscountAmount()) {
                discount = coupon.getMaxDiscountAmount();
            }
        }

        return Math.min(discount, originalPrice);
    }

    @Override
    public Double calculateSafeDiscount(String couponCode, Double originalPrice, String segment) {
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return 0.0;
        }

        String code = couponCode.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code).orElse(null);

        if (coupon == null) {
            if ("WELCOME100".equals(code)) return 100.0;
            if ("FIBER50".equals(code)) return 50.0;
            if ("TATA10".equals(code)) return originalPrice * 0.10;
            if ("ANNUAL20".equals(code)) {
                return originalPrice >= 4000.0 ? originalPrice * 0.20 : 0.0;
            }
            return 0.0;
        }

        if (coupon.getMinOrderAmount() != null && originalPrice < coupon.getMinOrderAmount()) {
            return 0.0;
        }

        if (coupon.getApplicableSegment() != null && !"ALL".equalsIgnoreCase(coupon.getApplicableSegment())) {
            if (segment != null && !coupon.getApplicableSegment().equalsIgnoreCase(segment) && !"ALL".equalsIgnoreCase(segment)) {
                return 0.0;
            }
        }

        Double discount = 0.0;
        if ("FLAT".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = coupon.getDiscountValue();
        } else if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = originalPrice * (coupon.getDiscountValue() / 100.0);
            if (coupon.getMaxDiscountAmount() != null && discount > coupon.getMaxDiscountAmount()) {
                discount = coupon.getMaxDiscountAmount();
            }
        }

        return Math.min(discount, originalPrice);
    }

    @Override
    public void seedPlans() {
        if (planRepository.count() > 0) return;

        BroadbandPlan p1 = BroadbandPlan.builder()
                .name("Basic Fiber Starter")
                .speedMbps(50)
                .price(549.0)
                .monthlyPrice(549.0)
                .quarterlyPrice(1564.0) // 5% off
                .semiAnnualPrice(2964.0) // 10% off
                .annualPrice(5270.0) // 20% off
                .validityDays(30)
                .description("Perfect starter pack for buffer-free browsing, zoom calls, and basic HD streaming.")
                .tagline("Essential Home Internet")
                .badgeText("Entry Level")
                .installationCharges(500.0)
                .routerIncluded(true)
                .ottBenefits("None")
                .recommended(false)
                .category("STARTER")
                .targetSegment("RETAIL")
                .technology("FTTH_WIFI5")
                .fupLimitGb(3300)
                .symmetricSpeed(true)
                .build();

        BroadbandPlan p2 = BroadbandPlan.builder()
                .name("Super Premium Value")
                .speedMbps(100)
                .price(799.0)
                .monthlyPrice(799.0)
                .quarterlyPrice(2277.0)
                .semiAnnualPrice(4314.0)
                .annualPrice(7670.0)
                .validityDays(30)
                .description("Most popular plan for HD streaming, smart home devices, and work-from-home.")
                .tagline("Best Value for Families")
                .badgeText("BESTSELLER")
                .installationCharges(0.0)
                .routerIncluded(true)
                .ottBenefits("Disney+ Hotstar, ZEE5, Hungama Play, ShemarooMe")
                .recommended(true)
                .category("VALUE")
                .targetSegment("BOTH")
                .technology("FTTH_WIFI5")
                .fupLimitGb(3300)
                .symmetricSpeed(true)
                .build();

        BroadbandPlan p3 = BroadbandPlan.builder()
                .name("Entertainment Streamer Pro")
                .speedMbps(150)
                .price(999.0)
                .monthlyPrice(999.0)
                .quarterlyPrice(2847.0)
                .semiAnnualPrice(5394.0)
                .annualPrice(9590.0)
                .validityDays(30)
                .description("Designed for multi-device 4K streaming and high bandwidth home media hubs.")
                .tagline("Unrestricted 4K Entertainment")
                .badgeText("POPULAR")
                .installationCharges(0.0)
                .routerIncluded(true)
                .ottBenefits("Amazon Prime Lite, Disney+ Hotstar, ZEE5, SonyLIV, JioCinema")
                .recommended(false)
                .category("STREAMER")
                .targetSegment("BOTH")
                .technology("FTTH_WIFI6")
                .fupLimitGb(3300)
                .symmetricSpeed(true)
                .build();

        BroadbandPlan p4 = BroadbandPlan.builder()
                .name("Gamer Ultra Pro Max")
                .speedMbps(300)
                .price(1499.0)
                .monthlyPrice(1499.0)
                .quarterlyPrice(4272.0)
                .semiAnnualPrice(8094.0)
                .annualPrice(14390.0)
                .validityDays(30)
                .description("Ultra-low ping connection tailored for hardcore esports, 8K streaming, and heavy gigabyte transfers.")
                .tagline("Esports Low Latency Engine")
                .badgeText("GAMING PRO")
                .installationCharges(0.0)
                .routerIncluded(true)
                .ottBenefits("Netflix Basic, Amazon Prime, Disney+ Hotstar, SonyLIV, ZEE5")
                .recommended(false)
                .category("GAMER")
                .targetSegment("BOTH")
                .technology("FTTH_WIFI6")
                .fupLimitGb(3300)
                .symmetricSpeed(true)
                .build();

        BroadbandPlan p5 = BroadbandPlan.builder()
                .name("Enterprise Leased Gigabit")
                .speedMbps(1000)
                .price(3999.0)
                .monthlyPrice(3999.0)
                .quarterlyPrice(11397.0)
                .semiAnnualPrice(21594.0)
                .annualPrice(38390.0)
                .validityDays(30)
                .description("Dedicated business fiber link with 99.99% SLA, Static IPv4, dual-WAN redundancy, and 24x7 NOC escalation.")
                .tagline("Corporate Enterprise Grade")
                .badgeText("ENTERPRISE SLA")
                .installationCharges(0.0)
                .routerIncluded(true)
                .ottBenefits("Corporate Suite, Static IP, Priority SLA NOC, Binge Pro")
                .recommended(false)
                .category("ENTERPRISE_LEASED")
                .targetSegment("ENTERPRISE")
                .technology("DEDICATED_ILL")
                .fupLimitGb(10000)
                .symmetricSpeed(true)
                .build();

        planRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5));
    }

    private void seedAddons() {
        if (addonItemRepository.count() > 0) return;

        AddonItem a1 = AddonItem.builder()
                .code("STATIC_IP")
                .name("Dedicated Static IPv4 Address")
                .category("NETWORK")
                .priceMonthly(199.0)
                .description("Fixed IP address essential for hosting VPN gateways, enterprise servers, and security cameras.")
                .iconName("Globe")
                .active(true)
                .build();

        AddonItem a2 = AddonItem.builder()
                .code("WIFI6_MESH")
                .name("Wi-Fi 6 Mesh Extender Node")
                .category("HARDWARE")
                .priceMonthly(149.0)
                .description("Eliminate dead zones across multi-story homes and offices with Seamless Mesh Roaming.")
                .iconName("Wifi")
                .active(true)
                .build();

        AddonItem a3 = AddonItem.builder()
                .code("BINGE_STB")
                .name("Tata Play Binge 4K Android Smart Box")
                .category("HARDWARE")
                .priceMonthly(99.0)
                .description("Transform any TV into a Smart TV with voice remote, Google Assistant, and 25+ OTT apps.")
                .iconName("Tv")
                .active(true)
                .build();

        AddonItem a4 = AddonItem.builder()
                .code("SECURITY_SHIELD")
                .name("Cyber Security & Parental Control Shield")
                .category("SECURITY")
                .priceMonthly(49.0)
                .description("AI-powered malware blocker, phishing protection, and customizable child content filters.")
                .iconName("ShieldCheck")
                .active(true)
                .build();

        addonItemRepository.saveAll(Arrays.asList(a1, a2, a3, a4));
    }

    private void seedCoupons() {
        if (couponRepository.count() > 0) return;

        Coupon c1 = Coupon.builder()
                .code("WELCOME100")
                .discountType("FLAT")
                .discountValue(100.0)
                .minOrderAmount(500.0)
                .description("Flat ₹100 instant discount on your first broadband connection.")
                .applicableSegment("ALL")
                .validUntil(LocalDateTime.now().plusYears(1))
                .active(true)
                .build();

        Coupon c2 = Coupon.builder()
                .code("ANNUAL20")
                .discountType("PERCENTAGE")
                .discountValue(20.0)
                .maxDiscountAmount(2000.0)
                .minOrderAmount(4000.0)
                .description("Save 20% on Annual Long-Term Plans + Free Mesh Router.")
                .applicableSegment("ALL")
                .validUntil(LocalDateTime.now().plusYears(1))
                .active(true)
                .build();

        Coupon c3 = Coupon.builder()
                .code("ENTBIZ15")
                .discountType("PERCENTAGE")
                .discountValue(15.0)
                .maxDiscountAmount(3000.0)
                .minOrderAmount(3000.0)
                .description("Exclusive 15% corporate discount for Enterprise accounts.")
                .applicableSegment("ENTERPRISE")
                .validUntil(LocalDateTime.now().plusYears(1))
                .active(true)
                .build();

        Coupon c4 = Coupon.builder()
                .code("FIBER50")
                .discountType("FLAT")
                .discountValue(50.0)
                .minOrderAmount(500.0)
                .description("Flat ₹50 instant cashback voucher.")
                .applicableSegment("RETAIL")
                .validUntil(LocalDateTime.now().plusYears(1))
                .active(true)
                .build();

        couponRepository.saveAll(Arrays.asList(c1, c2, c3, c4));
    }
}
