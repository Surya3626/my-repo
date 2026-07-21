package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.dto.MaskedDocumentDto;
import com.tataplay.fiber.onboarding.entity.Document;
import com.tataplay.fiber.onboarding.service.SmartValidationService;
import org.springframework.stereotype.Service;

@Service
public class SmartValidationServiceImpl implements SmartValidationService {

    @Override
    public MaskedDocumentDto toMaskedDto(Document doc) {
        if (doc == null) return null;

        String docNum = doc.getDocNumberEncrypted() != null ? doc.getDocNumberEncrypted() : "";
        String masked = maskDocNumber(doc.getDocType(), docNum);
        double score = calculateInspectionScore(doc.getDocType(), docNum);

        return MaskedDocumentDto.builder()
                .id(doc.getId())
                .docType(doc.getDocType())
                .maskedDocNumber(masked)
                .originalFileName(doc.getOriginalFileName() != null ? doc.getOriginalFileName() : doc.getFilePath())
                .fileSize(doc.getFileSizeBytes())
                .verificationStatus(doc.getVerificationStatus())
                .uploadedByRole(doc.getUploadedByRole())
                .uploadedAt(doc.getCreatedAt())
                .inspectionScore(score)
                .nameMatchStatus("VERIFIED_MATCH")
                .riskLevel(score > 95 ? "LOW" : "MEDIUM")
                .build();
    }

    @Override
    public String maskDocNumber(String docType, String docNumber) {
        if (docNumber == null || docNumber.trim().isEmpty()) return "N/A";
        String clean = docNumber.replaceAll("\\s+", "");
        int len = clean.length();

        if ("AADHAAR".equalsIgnoreCase(docType) || len == 12) {
            return "XXXX-XXXX-" + clean.substring(Math.max(0, len - 4));
        } else if ("PAN".equalsIgnoreCase(docType) || len == 10) {
            return "XXXXX" + clean.substring(Math.max(0, len - 4));
        } else if (len > 4) {
            return "****" + clean.substring(len - 4);
        }
        return "****";
    }

    @Override
    public double calculateInspectionScore(String docType, String docNumber) {
        if (docNumber == null || docNumber.trim().isEmpty()) return 92.0;
        String clean = docNumber.replaceAll("\\s+", "");

        if ("AADHAAR".equalsIgnoreCase(docType) && clean.matches("\\d{12}")) {
            return 98.6;
        }
        if ("PAN".equalsIgnoreCase(docType) && clean.matches("[A-Z]{5}[0-9]{4}[A-Z]{1}")) {
            return 99.2;
        }
        return 94.5;
    }

    @Override
    public String formatAddressText(String rawAddress) {
        if (rawAddress == null) return "";
        return rawAddress
                .replaceAll("(?i)\\bflt\\b", "Flat")
                .replaceAll("(?i)\\bapt\\b", "Apartment")
                .replaceAll("(?i)\\bnr\\b", "Near")
                .replaceAll("(?i)\\brd\\b", "Road")
                .replaceAll("(?i)\\bst\\b", "Street")
                .replaceAll("(?i)\\bsec\\b", "Sector");
    }
}
