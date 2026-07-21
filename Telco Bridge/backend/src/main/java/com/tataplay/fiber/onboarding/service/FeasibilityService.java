package com.tataplay.fiber.onboarding.service;

public interface FeasibilityService {
    boolean checkFeasibility(String pincode, Double latitude, Double longitude);
    void registerForExpansion(String mobileNumber, String email, String pincode);
}
