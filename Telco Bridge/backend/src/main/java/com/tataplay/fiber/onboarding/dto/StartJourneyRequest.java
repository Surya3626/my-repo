package com.tataplay.fiber.onboarding.dto;

import com.tataplay.fiber.onboarding.entity.OnboardingChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartJourneyRequest {

    private String prospectMobile;

    @NotNull(message = "Channel is required (SELF or SALES_AGENT)")
    private OnboardingChannel channel;

    /** The ID of the actor starting the journey (agentId or prospectMobile for self). */
    private String actorId;

    /** Optional: prefill data from a previous partial session. */
    private String initialPayloadJson;
}
