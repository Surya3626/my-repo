package com.tataplay.fiber.onboarding;

import com.tataplay.fiber.onboarding.entity.OtpLog;
import com.tataplay.fiber.onboarding.repository.OtpLogRepository;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.impl.OtpServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OtpServiceTests {

    @Mock
    private OtpLogRepository otpLogRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private OtpServiceImpl otpService;

    private String mobileNumber;

    @BeforeEach
    public void setUp() {
        mobileNumber = "9876543210";
    }

    @Test
    public void testSendOtpSuccess() {
        when(otpLogRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber))
                .thenReturn(Optional.empty());

        assertDoesNotThrow(() -> otpService.sendOtp(mobileNumber));
        verify(otpLogRepository, times(1)).save(any(OtpLog.class));
        verify(auditService, times(1)).log(eq("OTP_SENT"), anyString(), eq(mobileNumber));
    }

    @Test
    public void testSendOtpRateLimitException() {
        OtpLog recentLog = OtpLog.builder()
                .mobileNumber(mobileNumber)
                .otp("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();
        recentLog.setCreatedAt(LocalDateTime.now()); // recent

        when(otpLogRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber))
                .thenReturn(Optional.of(recentLog));

        Exception exception = assertThrows(RuntimeException.class, () -> otpService.sendOtp(mobileNumber));
        assertTrue(exception.getMessage().contains("Please wait 30 seconds"));
    }

    @Test
    public void testVerifyOtpSuccess() {
        OtpLog otpLog = OtpLog.builder()
                .mobileNumber(mobileNumber)
                .otp("555444")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .build();

        when(otpLogRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber))
                .thenReturn(Optional.of(otpLog));

        boolean result = otpService.verifyOtp(mobileNumber, "555444");
        assertTrue(result);
        assertTrue(otpLog.isVerified());
        verify(otpLogRepository, times(1)).save(otpLog);
    }

    @Test
    public void testVerifyOtpMasterCodeBypass() {
        boolean result = otpService.verifyOtp(mobileNumber, "123456");
        assertTrue(result);
    }

    @Test
    public void testVerifyOtpIncorrectCodeDecrementsRetries() {
        OtpLog otpLog = OtpLog.builder()
                .mobileNumber(mobileNumber)
                .otp("555444")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .verified(false)
                .retryCount(0)
                .build();

        when(otpLogRepository.findFirstByMobileNumberOrderByCreatedAtDesc(mobileNumber))
                .thenReturn(Optional.of(otpLog));

        Exception exception = assertThrows(RuntimeException.class, () -> otpService.verifyOtp(mobileNumber, "111111"));
        assertTrue(exception.getMessage().contains("Incorrect OTP"));
        assertEquals(1, otpLog.getRetryCount());
        verify(otpLogRepository, times(1)).save(otpLog);
    }
}
