package com.tataplay.fiber.onboarding.entity;

/** Which channel initiated this onboarding journey. */
public enum OnboardingChannel {
    SELF,          // Customer completed onboarding themselves
    SALES_AGENT    // A Sales Agent performed onboarding on behalf of the customer
}
