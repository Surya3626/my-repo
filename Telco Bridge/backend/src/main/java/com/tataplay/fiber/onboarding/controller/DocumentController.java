package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.entity.Document;
import com.tataplay.fiber.onboarding.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    /**
     * Single document upload (Customer flow)
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Document>> uploadDocument(
            @RequestParam String docType,
            @RequestParam(required = false, defaultValue = "") String docNumber,
            @RequestParam("file") MultipartFile file) {

        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Document doc = documentService.uploadDocument(mobileNumber, docType, docNumber, file, "CUSTOMER");
        return ResponseEntity.ok(ApiResponse.success("Document uploaded successfully", doc));
    }

    /**
     * Batch / Multiple document upload (Customer flow)
     * Accepts multiple files for the same document type (e.g. front + back of Aadhaar)
     */
    @PostMapping("/upload/batch")
    public ResponseEntity<ApiResponse<List<Document>>> uploadDocumentsBatch(
            @RequestParam String docType,
            @RequestParam(required = false, defaultValue = "") String docNumber,
            @RequestParam("files") List<MultipartFile> files) {

        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Document> docs = documentService.uploadDocuments(mobileNumber, docType, docNumber, files, "CUSTOMER");
        return ResponseEntity.ok(ApiResponse.success(
                docs.size() + " document(s) uploaded successfully", docs));
    }

    /**
     * Webcam / live selfie capture (base64 encoded image from browser camera)
     */
    @PostMapping("/selfie")
    public ResponseEntity<ApiResponse<Document>> uploadSelfie(@RequestBody Map<String, String> payload) {
        String base64Data = payload.get("image");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            throw new RuntimeException("Image data is required in base64 format");
        }

        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Document doc = documentService.saveWebcamSelfie(mobileNumber, base64Data, "CUSTOMER");
        return ResponseEntity.ok(ApiResponse.success("Webcam selfie uploaded successfully", doc));
    }

    /**
     * List all documents for the authenticated customer
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Document>>> listMyDocuments() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Document> docs = documentService.getDocumentsByMobile(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Documents retrieved successfully", docs));
    }

    /**
     * Download / view a specific document file
     */
    @GetMapping("/file/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        Resource file = documentService.loadDocumentFile(id);

        String contentType = "application/octet-stream";
        try {
            String filename = file.getFilename() != null ? file.getFilename().toLowerCase() : "";
            if (filename.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.endsWith(".txt")) {
                contentType = "text/plain";
            }
        } catch (Exception e) {
            // keep octet-stream
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    /**
     * Generate customer declaration form
     */
    @PostMapping("/declaration")
    public ResponseEntity<ApiResponse<Document>> generateDeclaration() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Document doc = documentService.generateDeclarationForm(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Declaration form generated successfully", doc));
    }
}
