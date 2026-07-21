package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.FeasibilityService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeasibilityServiceImpl implements FeasibilityService {

    private static final Logger log = LoggerFactory.getLogger(FeasibilityServiceImpl.class);
    private final AuditService auditService;

    @Override
    public boolean checkFeasibility(String pincode, Double latitude, Double longitude) {
        if (pincode == null || pincode.trim().length() != 6) {
            throw new RuntimeException("Invalid Indian PIN code. Must be exactly 6 digits.");
        }

        // Pincodes ending in 9 are mock-configured as non-feasible to demonstrate expanding coverage flows
        if (pincode.endsWith("9")) {
            log.info("Feasibility check FAILED for PIN: {}, coordinates: [{}, {}]", pincode, latitude, longitude);
            return false;
        }

        log.info("Feasibility check PASSED for PIN: {}, coordinates: [{}, {}]", pincode, latitude, longitude);
        return true;
    }

    @Override
    public void registerForExpansion(String mobileNumber, String email, String pincode) {
        log.info("Registered expansion request for Mobile: {}, Email: {}, PIN: {}", mobileNumber, email, pincode);
        auditService.log("FEASIBILITY_EXPANSION_REGISTERED", 
                "User registered for service expansion alerts at PIN: " + pincode, 
                mobileNumber != null ? mobileNumber : email);
    }
}
