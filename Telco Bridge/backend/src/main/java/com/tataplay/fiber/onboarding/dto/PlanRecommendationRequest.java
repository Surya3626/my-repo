package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanRecommendationRequest {
    private Integer deviceCount;
    private String primaryUsage; // STREAMING_4K, GAMING, WFH, SMART_HOME
    private String customerCategory; // RETAIL, ENTERPRISE
    private Boolean needOtt;
}
