package com.tataplay.fiber.onboarding.dto;

import com.tataplay.fiber.onboarding.entity.OnboardingStep;
import com.tataplay.fiber.onboarding.entity.PerformedByType;
import com.tataplay.fiber.onboarding.entity.StepAuditStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StepAuditDto {

    private Long id;
    private OnboardingStep step;
    private StepAuditStatus status;
    private PerformedByType performedByType;
    private String performedById;
    private LocalDateTime performedAt;
    private String payloadSnapshot;
}
