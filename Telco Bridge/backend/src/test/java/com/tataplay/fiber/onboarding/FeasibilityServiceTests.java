package com.tataplay.fiber.onboarding;

import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.impl.FeasibilityServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class FeasibilityServiceTests {

    @Mock
    private AuditService auditService;

    @InjectMocks
    private FeasibilityServiceImpl feasibilityService;

    @Test
    public void testPincodeFeasibilitySuccess() {
        boolean result = feasibilityService.checkFeasibility("400001", 19.0, 72.0);
        assertTrue(result);
    }

    @Test
    public void testPincodeFeasibilityFailureOnEndingNine() {
        boolean result = feasibilityService.checkFeasibility("400009", 19.0, 72.0);
        assertFalse(result);
    }

    @Test
    public void testInvalidPincodeLengthThrowsException() {
        Exception exception = assertThrows(RuntimeException.class, () -> 
            feasibilityService.checkFeasibility("4000", null, null)
        );
        assertTrue(exception.getMessage().contains("Indian PIN code"));
    }
}
