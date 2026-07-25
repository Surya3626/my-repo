package com.tataplay.fiber.onboarding.entity;

/** Status of a single step audit row. Append-only — never updated. */
public enum StepAuditStatus {
    STARTED,
    COMPLETED,
    SKIPPED,    // e.g. OTP_VERIFICATION in SALES_AGENT channel
    FAILED
}
