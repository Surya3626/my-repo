package com.tataplay.fiber.onboarding.entity;

/**
 * All steps in the onboarding flow, in canonical order.
 * DOCUMENT_MIGRATION is backend-only (no UI step); the router skips rendering it.
 */
public enum OnboardingStep {
    FEASIBILITY_CHECK,
    CUSTOMER_DETAILS,
    OTP_VERIFICATION,        // SELF channel only; SKIPPED in SALES_AGENT channel
    DOCUMENT_COLLECTION,
    BUILD_PROFILE,
    PLANS_ADDONS_COUPONS,
    PAYMENT,
    DOCUMENT_MIGRATION,      // Backend-only; SYSTEM-performed; no UI
    CUSTOMER_CONSENT,
    CAF_GENERATION,
    EKYC_INITIATION
}
