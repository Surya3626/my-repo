package com.tataplay.fiber.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JourneyRequest {

    @NotBlank(message = "Page title/route is required")
    private String page;

    private int step;
    
    private String draftData; // Serialized JSON string of state data
    
    private String sessionId;
    
    private String browser;
    
    private String device;

    private String mobileNumber;

    private String performedByRole; // SOC_ADMIN or CUSTOMER

    private String performedById; // e.g. admin or prospectId

    private String performedByName; // Display name

    private String stepHistoryJson;
}
