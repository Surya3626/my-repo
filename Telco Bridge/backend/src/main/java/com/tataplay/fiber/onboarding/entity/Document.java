package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "doc_type", nullable = false)
    private String docType; // AADHAAR, PAN, VOTER_ID, DRIVING_LICENSE, PASSPORT, SELFIE, DECLARATION, CAF

    @Column(name = "doc_number_encrypted")
    private String docNumberEncrypted; // Sensitive field (e.g. ID number encrypted via AES)

    @Column(name = "file_path", nullable = false)
    private String filePath; // Local filesystem path (migrate to SharePoint later)

    @Column(name = "original_file_name")
    private String originalFileName; // User-facing filename shown in UI

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes; // File size in bytes

    @Column(name = "file_type", nullable = false)
    private String fileType; // MIME type

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus; // PENDING, APPROVED, REJECTED

    @Column(name = "uploaded_by_role")
    private String uploadedByRole; // CUSTOMER or SALES_AGENT

    @Column(name = "ocr_metadata", length = 1000)
    private String ocrMetadata; // Extracted OCR content placeholder

    // Future enterprise: SharePoint URL for document storage integration
    @Column(name = "sharepoint_url", length = 500)
    private String sharepointUrl;
}
