package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.entity.OtpLog;
import com.tataplay.fiber.onboarding.repository.OtpLogRepository;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpServiceImpl.class);
    private final OtpLogRepository otpLogRepository;
    private final AuditService auditService;
    private final Random random = new Random();

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_RETRIES = 3;

    @Override
    @Transactional
    public void sendOtp(String mobileNumber) {
        // Rate limit check: avoid generating OTP within 30 seconds
        Optional<OtpLog> lastOtpOpt = otpLogRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber);
        if (lastOtpOpt.isPresent()) {
            OtpLog lastOtp = lastOtpOpt.get();
            if (lastOtp.getCreatedAt().plusSeconds(30).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Please wait 30 seconds before requesting another OTP.");
            }
        }

        // Generate 6 digit OTP
        String otp = String.format("%06d", random.nextInt(900000) + 100000);
        
        // For development convenience, we also allow the master OTP 123456
        log.info("-----------------------------------------------------------------");
        log.info("TPF MOCK NOTIFICATION SYSTEM");
        log.info("To Mobile: {}", mobileNumber);
        log.info("Message: Your Tata Play Fiber login OTP is {}. Expires in {} mins.", otp, OTP_EXPIRY_MINUTES);
        log.info("-----------------------------------------------------------------");

        OtpLog otpLog = OtpLog.builder()
                .mobileNumber(mobileNumber)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .verified(false)
                .retryCount(0)
                .build();

        otpLogRepository.save(otpLog);
        auditService.log("OTP_SENT", "OTP generated and sent to: " + mobileNumber, mobileNumber);
    }

    @Override
    @Transactional
    public boolean verifyOtp(String mobileNumber, String otp) {
        // Master OTP check
        if ("123456".equals(otp)) {
            log.info("Master OTP verified for mobile: {}", mobileNumber);
            auditService.log("OTP_VERIFIED", "Master OTP verification successful", mobileNumber);
            return true;
        }

        Optional<OtpLog> lastOtpOpt = otpLogRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber);
        if (lastOtpOpt.isEmpty()) {
            auditService.log("OTP_FAILED", "No OTP record found for mobile", mobileNumber);
            throw new RuntimeException("No OTP requested for this mobile number.");
        }

        OtpLog otpLog = lastOtpOpt.get();

        if (otpLog.isVerified()) {
            throw new RuntimeException("OTP already verified. Please request a new one.");
        }

        if (otpLog.getExpiryTime().isBefore(LocalDateTime.now())) {
            auditService.log("OTP_EXPIRED", "Expired OTP submitted", mobileNumber);
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (otpLog.getRetryCount() >= MAX_RETRIES) {
            auditService.log("OTP_LOCKED", "Max retry limits reached for OTP verify", mobileNumber);
            throw new RuntimeException("Maximum retry attempts exceeded. Please request a new OTP.");
        }

        if (otpLog.getOtp().equals(otp)) {
            otpLog.setVerified(true);
            otpLogRepository.save(otpLog);
            auditService.log("OTP_VERIFIED", "OTP verified successfully", mobileNumber);
            return true;
        } else {
            otpLog.setRetryCount(otpLog.getRetryCount() + 1);
            otpLogRepository.save(otpLog);
            auditService.log("OTP_FAILED", "Incorrect OTP submitted. Attemp: " + otpLog.getRetryCount(), mobileNumber);
            throw new RuntimeException("Incorrect OTP. Attempts remaining: " + (MAX_RETRIES - otpLog.getRetryCount()));
        }
    }
}
