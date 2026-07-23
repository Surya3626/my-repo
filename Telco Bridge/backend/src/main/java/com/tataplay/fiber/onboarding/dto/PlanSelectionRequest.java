package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanSelectionRequest {
    private Long planId;
    private String customerCategory; // RETAIL, ENTERPRISE
    private String billingType; // PREPAID, POSTPAID
    private Integer billingCycleMonths; // 1, 3, 6, 12
    private Integer creditPeriodDays; // 0, 15, 30, 60
    private String poNumber; // Enterprise Purchase Order number
    private String corporateGstin;
    private List<Long> addonIds;
    private String couponCode;
    private Double securityDeposit;
    private Double calculatedTotal;
}
