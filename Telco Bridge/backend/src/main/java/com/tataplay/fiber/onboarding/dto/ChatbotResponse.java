package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponse {
    private String query;
    private String reply;
    private String intent;
    private String stepHint;
    private List<ActionChip> actionChips;
    private RichCard richCard;
    private List<String> suggestedPrompts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionChip {
        private String label;
        private String action; // NAVIGATE, AUTOFILL, APPLY_COUPON, RUN_DIAGNOSTIC, SELECT_PLAN, TRACK_ETA, OPEN_MODAL
        private String payload;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RichCard {
        private String type; // PLAN_MATCH, DIAGNOSTIC_RESULT, TECHNICIAN_ETA, DOCUMENT_VAULT
        private String title;
        private String subtitle;
        private Map<String, Object> data;
    }
}
