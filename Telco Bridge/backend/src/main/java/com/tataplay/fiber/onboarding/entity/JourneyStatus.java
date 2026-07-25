package com.tataplay.fiber.onboarding.entity;

/** Overall status of an onboarding journey. */
public enum JourneyStatus {
    IN_PROGRESS,
    COMPLETED,
    ABANDONED    // Agent saved and exited; customer has not yet resumed
}
