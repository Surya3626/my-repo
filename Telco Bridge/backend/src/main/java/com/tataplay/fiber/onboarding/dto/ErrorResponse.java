package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private boolean success;
    private String message;
    private String correlationId;
    private Map<String, String> errors; // Field-level validation errors
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static ErrorResponse of(String message, String correlationId, Map<String, String> errors) {
        return ErrorResponse.builder()
                .success(false)
                .message(message)
                .correlationId(correlationId)
                .errors(errors)
                .build();
    }
}
