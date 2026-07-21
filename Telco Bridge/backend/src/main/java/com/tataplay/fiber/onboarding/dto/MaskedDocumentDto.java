package com.tataplay.fiber.onboarding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * MaskedDocumentDto enforces customer document PII protection.
 * Returns masked document numbers (e.g. XXXX-XXXX-4821) and AI inspection scores
 * WITHOUT exposing raw file download URLs to admins.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaskedDocumentDto {
    private Long id;
    private String docType;
    private String maskedDocNumber;
    private String originalFileName;
    private Long fileSize;
    private String verificationStatus;
    private String uploadedByRole;
    private LocalDateTime uploadedAt;

    // Smart Inspection Badges
    private double inspectionScore; // e.g. 98.6%
    private String nameMatchStatus;  // MATCHED / PARTIAL / UNMATCHED
    private String riskLevel;        // LOW / MEDIUM / HIGH
}
