package com.tataplay.fiber.onboarding.dto;

import com.tataplay.fiber.onboarding.entity.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/** Full journey state returned by GET /api/onboarding/{id} and POST /api/onboarding/{id}/resume. */
@Data
@Builder
public class OnboardingJourneyDto {

    private Long journeyId;
    private String prospectMobile;
    private OnboardingChannel channel;
    private OnboardingStep currentStep;
    private JourneyStatus status;
    private String lastActorId;
    private PerformedByType lastActorType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Full ordered audit trail — all step transitions. */
    private List<StepAuditDto> auditTrail;

    /** Convenience: payload snapshots keyed by step name for form hydration on resume. */
    private java.util.Map<String, String> stepPayloads;
}
