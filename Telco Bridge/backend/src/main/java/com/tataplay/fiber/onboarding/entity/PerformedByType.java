package com.tataplay.fiber.onboarding.entity;

/** Who performed a particular step transition. */
public enum PerformedByType {
    CUSTOMER,      // Customer self-service portal
    SALES_AGENT,   // Sales agent acting on behalf of customer
    SYSTEM         // Automated/backend-only step (e.g. Document Migration)
}
