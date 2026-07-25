package com.tataplay.fiber.onboarding.dto;

import lombok.Data;

@Data
public class CompleteStepRequest {

    /** The actor completing this step (agentId, mobile number, or "SYSTEM"). */
    private String actorId;

    /** JSON snapshot of the data captured at this step (for resume hydration). */
    private String payloadJson;
}
