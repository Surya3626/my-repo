package com.tataplay.fiber.onboarding;

import com.tataplay.fiber.onboarding.controller.OnboardingJourneyController;
import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.dto.OnboardingJourneyDto;
import com.tataplay.fiber.onboarding.repository.OnboardingJourneyRepository;
import com.tataplay.fiber.onboarding.service.OnboardingJourneyService;
import com.tataplay.fiber.onboarding.service.impl.OnboardingJourneyServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OnboardingJourneyResumeTests {

    @Mock
    private OnboardingJourneyRepository journeyRepository;

    @InjectMocks
    private OnboardingJourneyServiceImpl journeyService;

    @Mock
    private OnboardingJourneyService mockJourneyService;

    @InjectMocks
    private OnboardingJourneyController journeyController;

    @Test
    public void testResumeUnregisteredMobileThrowsException() {
        String unregisteredMobile = "9999999999";
        when(journeyRepository.findTopByProspectMobileOrderByCreatedAtDesc(unregisteredMobile))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            journeyService.resumeByMobile(unregisteredMobile);
        });
    }

    @Test
    public void testResumeControllerReturns404ForUnregisteredMobile() {
        String unregisteredMobile = "9999999999";
        when(mockJourneyService.resumeByMobile(unregisteredMobile))
                .thenThrow(new IllegalArgumentException("No onboarding journey found for mobile: " + unregisteredMobile));

        ResponseEntity<ApiResponse<OnboardingJourneyDto>> response =
                journeyController.resumeJourney(Map.of("prospectMobile", unregisteredMobile));

        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("No active onboarding journey found"));
    }

    @Test
    public void testCheckControllerReturns404ForUnregisteredMobile() {
        String unregisteredMobile = "9999999999";
        when(mockJourneyService.resumeByMobile(unregisteredMobile))
                .thenThrow(new IllegalArgumentException("No onboarding journey found for mobile: " + unregisteredMobile));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                journeyController.checkJourney(unregisteredMobile);

        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("No active onboarding journey found"));
    }
}

