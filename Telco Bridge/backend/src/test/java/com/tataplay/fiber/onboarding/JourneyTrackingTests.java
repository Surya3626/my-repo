package com.tataplay.fiber.onboarding;

import com.tataplay.fiber.onboarding.entity.JourneyTracking;
import com.tataplay.fiber.onboarding.repository.JourneyTrackingRepository;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.impl.JourneyServiceImpl;
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
public class JourneyTrackingTests {

    @Mock
    private JourneyTrackingRepository journeyTrackingRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private JourneyServiceImpl journeyService;

    private String mobileNumber;

    @BeforeEach
    public void setUp() {
        mobileNumber = "9876543210";
    }

    @Test
    public void testSaveProgressNewJourney() {
        when(journeyTrackingRepository.findByMobileNumber(mobileNumber))
                .thenReturn(Optional.empty());
        when(journeyTrackingRepository.save(any(JourneyTracking.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        JourneyTracking result = journeyService.saveProgress(
                mobileNumber, "/address", 2, "{}", "SESS123", "Chrome", "Mobile", "127.0.0.1");

        assertNotNull(result);
        assertEquals("/address", result.getCurrentPage());
        assertEquals(2, result.getCurrentStep());
        assertEquals("{}", result.getDraftData());
        verify(journeyTrackingRepository, times(1)).save(any(JourneyTracking.class));
    }

    @Test
    public void testSaveProgressUpdateJourney() {
        JourneyTracking existing = JourneyTracking.builder()
                .mobileNumber(mobileNumber)
                .currentPage("/register")
                .currentStep(1)
                .draftData("old_data")
                .sessionId("SESS123")
                .lastActiveAt(LocalDateTime.now().minusHours(1))
                .build();

        when(journeyTrackingRepository.findByMobileNumber(mobileNumber))
                .thenReturn(Optional.of(existing));
        when(journeyTrackingRepository.save(existing))
                .thenReturn(existing);

        JourneyTracking result = journeyService.saveProgress(
                mobileNumber, "/plans", 3, "new_data", "SESS123", "Safari", "Desktop", "192.168.1.1");

        assertNotNull(result);
        assertEquals("/plans", result.getCurrentPage());
        assertEquals(3, result.getCurrentStep());
        assertEquals("new_data", result.getDraftData());
        verify(journeyTrackingRepository, times(1)).save(existing);
    }
}
