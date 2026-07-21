package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.dto.MaskedDocumentDto;
import com.tataplay.fiber.onboarding.entity.Document;

public interface SmartValidationService {
    MaskedDocumentDto toMaskedDto(Document doc);
    String maskDocNumber(String docType, String docNumber);
    double calculateInspectionScore(String docType, String docNumber);
    String formatAddressText(String rawAddress);
}
