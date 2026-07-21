package com.tataplay.fiber.onboarding.service;

public interface OtpService {
    void sendOtp(String mobileNumber);
    boolean verifyOtp(String mobileNumber, String otp);
}
