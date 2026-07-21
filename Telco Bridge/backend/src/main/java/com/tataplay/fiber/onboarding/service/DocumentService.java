package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.entity.Document;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {
    // Single document upload (customer or admin)
    Document uploadDocument(String mobileNumber, String docType, String docNumber, MultipartFile file, String uploadedByRole);

    // Legacy overload for backward compat
    default Document uploadDocument(String mobileNumber, String docType, String docNumber, MultipartFile file) {
        return uploadDocument(mobileNumber, docType, docNumber, file, "CUSTOMER");
    }

    // Batch upload — multiple files at once
    List<Document> uploadDocuments(String mobileNumber, String docType, String docNumber, List<MultipartFile> files, String uploadedByRole);

    // Selfie / live webcam capture (base64 encoded)
    Document saveWebcamSelfie(String mobileNumber, String base64Data, String uploadedByRole);

    // Legacy overload
    default Document saveWebcamSelfie(String mobileNumber, String base64Data) {
        return saveWebcamSelfie(mobileNumber, base64Data, "CUSTOMER");
    }

    // Retrieve all documents for a customer
    List<Document> getDocumentsByMobile(String mobileNumber);

    // File download
    Resource loadDocumentFile(Long documentId);

    // Admin KYC approval / rejection
    Document approveKYC(Long documentId, boolean approved);

    // Declaration form generation
    Document generateDeclarationForm(String mobileNumber);

    // CAF form generation
    Document generateCafForm(String mobileNumber);

    // Migrate documents from prospect folder to customer folder after payment
    void migrateDocumentsToCustomerId(String mobileNumber);
}
