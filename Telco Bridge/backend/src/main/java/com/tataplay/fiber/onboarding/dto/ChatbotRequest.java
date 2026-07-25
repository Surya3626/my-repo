package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotRequest {
    private String message;
    private Object currentStep;
    private String pageContext; // ONBOARDING, SELFCARE, ADMIN
    private String language; // EN, HI, GU, MR, TA
    private Map<String, Object> metadata;
}
