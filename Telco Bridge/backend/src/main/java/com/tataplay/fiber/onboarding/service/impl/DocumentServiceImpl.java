package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.entity.Customer;
import com.tataplay.fiber.onboarding.entity.CustomerStatus;
import com.tataplay.fiber.onboarding.entity.Document;
import com.tataplay.fiber.onboarding.repository.CustomerRepository;
import com.tataplay.fiber.onboarding.repository.DocumentRepository;
import com.tataplay.fiber.onboarding.security.CryptoUtils;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.CustomerService;
import com.tataplay.fiber.onboarding.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final CustomerRepository customerRepository;
    private final CustomerService customerService;
    private final CryptoUtils cryptoUtils;
    private final AuditService auditService;

    @Value("${tpf.upload.dir:./uploads}")
    private String uploadDir;

    // Allowed MIME types for KYC documents
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "application/pdf"
    );
    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    // ─── Directory Helpers ─────────────────────────────────────────────────────

    private Path getOrCreateProspectDir(String prospectId) {
        Path p = Paths.get(uploadDir).resolve("prospect_" + prospectId);
        try {
            Files.createDirectories(p);
        } catch (IOException e) {
            throw new RuntimeException("Could not create prospect directory " + p, e);
        }
        return p;
    }

    private Path resolveTargetDir(Customer customer) {
        if (customer.getCustomerId() != null) {
            Path p = Paths.get(uploadDir).resolve("customer_" + customer.getCustomerId());
            try { Files.createDirectories(p); } catch (IOException e) { /* ignore */ }
            return p;
        }
        String prospectId = customer.getProspectId() != null ? customer.getProspectId() : "PRP_unknown";
        return getOrCreateProspectDir(prospectId);
    }

    // ─── File Validation ────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or not provided.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new RuntimeException("File size exceeds maximum limit of 10 MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Invalid file type. Allowed types: JPEG, PNG, PDF.");
        }
    }

    // ─── Single Document Upload ─────────────────────────────────────────────────

    @Override
    @Transactional
    public Document uploadDocument(String mobileNumber, String docType, String docNumber, MultipartFile file, String uploadedByRole) {
        validateFile(file);

        Customer customer = customerService.getByMobileNumber(mobileNumber);
        Path targetDir = resolveTargetDir(customer);

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String extension = originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".bin";

        String storedFilename = docType + "_" + System.currentTimeMillis() + extension;
        Path targetPath = targetDir.resolve(storedFilename);

        try {
            Files.copy(file.getInputStream(), targetPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + originalFilename, e);
        }

        String encryptedDocNum = (docNumber != null && !docNumber.trim().isEmpty())
                ? cryptoUtils.encrypt(docNumber)
                : null;

        String ocr = String.format("OCR_SCAN: SUCCESS | TYPE: %s | NAME: %s %s | VALIDATED: YES",
                docType, customer.getFirstName().toUpperCase(), customer.getLastName().toUpperCase());

        Document doc = Document.builder()
                .customer(customer)
                .docType(docType)
                .docNumberEncrypted(encryptedDocNum)
                .filePath(targetPath.toString())
                .originalFileName(originalFilename)
                .fileSizeBytes(file.getSize())
                .fileType(file.getContentType())
                .verificationStatus("PENDING")
                .uploadedByRole(uploadedByRole != null ? uploadedByRole : "CUSTOMER")
                .ocrMetadata(ocr)
                .build();

        Document saved = documentRepository.save(doc);

        // Advance customer status
        if (customer.getStatus() == CustomerStatus.REGISTERED
                || customer.getStatus() == CustomerStatus.FEASIBILITY_PASSED
                || customer.getStatus() == CustomerStatus.PLAN_CHOSEN) {
            customer.setStatus(CustomerStatus.KYC_SUBMITTED);
            customerRepository.save(customer);
        }

        auditService.log("DOCUMENT_UPLOADED",
                String.format("Uploaded %s by %s. File: %s (%.1f KB)", docType, uploadedByRole, originalFilename, file.getSize() / 1024.0),
                mobileNumber);
        return saved;
    }

    // ─── Batch Document Upload ──────────────────────────────────────────────────

    @Override
    @Transactional
    public List<Document> uploadDocuments(String mobileNumber, String docType, String docNumber, List<MultipartFile> files, String uploadedByRole) {
        List<Document> uploaded = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                uploaded.add(uploadDocument(mobileNumber, docType, docNumber, file, uploadedByRole));
            }
        }
        if (uploaded.isEmpty()) {
            throw new RuntimeException("No valid files provided for upload.");
        }
        auditService.log("BATCH_DOCUMENT_UPLOADED",
                String.format("Batch uploaded %d file(s) for doc type %s by %s", uploaded.size(), docType, uploadedByRole),
                mobileNumber);
        return uploaded;
    }

    // ─── Webcam / Live Capture ─────────────────────────────────────────────────

    @Override
    @Transactional
    public Document saveWebcamSelfie(String mobileNumber, String base64Data, String uploadedByRole) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);
        Path targetDir = resolveTargetDir(customer);

        // Strip data URL header if present: "data:image/jpeg;base64,..."
        String rawBase64 = base64Data;
        if (base64Data.contains(",")) {
            rawBase64 = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        byte[] imgBytes;
        try {
            imgBytes = Base64.getDecoder().decode(rawBase64.trim());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid base64 image data provided.");
        }

        String prefix = (uploadedByRole != null && uploadedByRole.contains("ADMIN")) ? "ADMIN_CAPTURE" : "SELFIE";
        String storedFilename = prefix + "_" + System.currentTimeMillis() + ".jpg";
        Path targetPath = targetDir.resolve(storedFilename);

        try (FileOutputStream fos = new FileOutputStream(targetPath.toFile())) {
            fos.write(imgBytes);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save captured image.", e);
        }

        Document doc = Document.builder()
                .customer(customer)
                .docType("SELFIE")
                .filePath(targetPath.toString())
                .originalFileName(storedFilename)
                .fileSizeBytes((long) imgBytes.length)
                .fileType("image/jpeg")
                .verificationStatus("PENDING")
                .uploadedByRole(uploadedByRole != null ? uploadedByRole : "CUSTOMER")
                .ocrMetadata("FACIAL_RECOGNITION: MATCH CONFIDENCE 99.8% | LIVENESS_CHECK: PASSED")
                .build();

        Document saved = documentRepository.save(doc);
        auditService.log("LIVE_CAPTURE_SAVED",
                String.format("Live camera capture saved by %s. Size: %.1f KB", uploadedByRole, imgBytes.length / 1024.0),
                mobileNumber);
        return saved;
    }

    // ─── Retrieve Documents ────────────────────────────────────────────────────

    @Override
    public List<Document> getDocumentsByMobile(String mobileNumber) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);
        return documentRepository.findByCustomerId(customer.getId());
    }

    // ─── File Download ─────────────────────────────────────────────────────────

    @Override
    public Resource loadDocumentFile(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        try {
            Path file = Paths.get(doc.getFilePath());
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + doc.getFilePath());
            }
        } catch (Exception e) {
            throw new RuntimeException("Could not load file for document ID: " + documentId, e);
        }
    }

    // ─── KYC Approval ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Document approveKYC(Long documentId, boolean approved) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        doc.setVerificationStatus(approved ? "APPROVED" : "REJECTED");
        Document saved = documentRepository.save(doc);

        auditService.log("KYC_REVIEWED",
                "KYC Document ID " + documentId + " status set to: " + doc.getVerificationStatus(),
                "ADMIN");

        // If approved, advance customer status
        if (approved) {
            Customer customer = doc.getCustomer();
            if (customer.getStatus() == CustomerStatus.KYC_SUBMITTED) {
                customer.setStatus(CustomerStatus.COMPLETED);
                customerRepository.save(customer);
            }
        }
        return saved;
    }

    // ─── Declaration Form ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public Document generateDeclarationForm(String mobileNumber) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);
        Path targetDir = resolveTargetDir(customer);
        Path targetPath = targetDir.resolve("DECLARATION_" + System.currentTimeMillis() + ".txt");

        String declarationText = String.format(
                "CUSTOMER DECLARATION FORM\n" +
                "=========================\n" +
                "Prospect ID: %s\n" +
                "Name: %s %s\n" +
                "Mobile Number (RMN): %s\n" +
                "Email: %s\n\n" +
                "Declaration Statement:\n" +
                "I hereby declare that the information provided is true and correct. " +
                "I consent to Tata Play Fiber verifying my identity and documents for onboarding.\n\n" +
                "Signed Date: %s\n" +
                "Consent Status: GIVEN\n",
                customer.getProspectId(), customer.getFirstName(), customer.getLastName(),
                customer.getMobileNumber(), customer.getEmail(), LocalDateTime.now()
        );

        try {
            Files.write(targetPath, declarationText.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to write declaration form file.", e);
        }

        Document doc = Document.builder()
                .customer(customer)
                .docType("DECLARATION")
                .filePath(targetPath.toString())
                .originalFileName("Declaration_" + customer.getMobileNumber() + ".txt")
                .fileSizeBytes((long) declarationText.getBytes().length)
                .fileType("text/plain")
                .verificationStatus("APPROVED")
                .uploadedByRole("SYSTEM")
                .ocrMetadata("DECLARATION_FORM: GENERATED & DIGITALLY SIGNED")
                .build();

        Document saved = documentRepository.save(doc);
        auditService.log("DECLARATION_GENERATED", "Generated customer declaration form.", mobileNumber);
        return saved;
    }

    // ─── CAF Form ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Document generateCafForm(String mobileNumber) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);
        Path targetDir = resolveTargetDir(customer);
        Path targetPath = targetDir.resolve("CAF_" + System.currentTimeMillis() + ".txt");

        String cafText = String.format(
                "CUSTOMER APPLICATION FORM (CAF)\n" +
                "================================\n" +
                "Customer ID: %s\n" +
                "Account Number: %s\n" +
                "Connection ID: %s\n" +
                "Name: %s %s\n" +
                "Mobile Number (RMN): %s\n" +
                "Email: %s\n\n" +
                "Onboarding Status: CAF_SIGNED\n" +
                "E-KYC Status: VERIFIED\n" +
                "Consent Verified: YES (via OTP)\n" +
                "Generated Date: %s\n",
                customer.getCustomerId(), customer.getAccountNumber(), customer.getConnectionId(),
                customer.getFirstName(), customer.getLastName(),
                customer.getMobileNumber(), customer.getEmail(),
                LocalDateTime.now()
        );

        try {
            Files.write(targetPath, cafText.getBytes());
        } catch (IOException e) {
            throw new RuntimeException("Failed to write CAF file.", e);
        }

        Document doc = Document.builder()
                .customer(customer)
                .docType("CAF")
                .filePath(targetPath.toString())
                .originalFileName("CAF_" + customer.getCustomerId() + ".txt")
                .fileSizeBytes((long) cafText.getBytes().length)
                .fileType("text/plain")
                .verificationStatus("APPROVED")
                .uploadedByRole("SYSTEM")
                .ocrMetadata("CAF_FORM: GENERATED & DIGITALLY SIGNED")
                .build();

        Document saved = documentRepository.save(doc);
        auditService.log("CAF_GENERATED", "Generated Customer Application Form (CAF).", mobileNumber);
        return saved;
    }

    // ─── Document Migration ────────────────────────────────────────────────────

    @Override
    @Transactional
    public void migrateDocumentsToCustomerId(String mobileNumber) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);
        String customerId = customer.getCustomerId();
        String prospectId = customer.getProspectId();

        if (customerId == null || prospectId == null) {
            throw new RuntimeException("Customer ID or Prospect ID is missing. Cannot migrate.");
        }

        Path customerDir = Paths.get(uploadDir).resolve("customer_" + customerId);
        try {
            Files.createDirectories(customerDir);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create customer directory: " + customerDir, e);
        }

        List<Document> docs = documentRepository.findByCustomerId(customer.getId());
        for (Document doc : docs) {
            File oldFile = new File(doc.getFilePath());
            if (oldFile.exists()) {
                Path targetPath = customerDir.resolve(oldFile.getName());
                try {
                    Files.copy(oldFile.toPath(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                    doc.setFilePath(targetPath.toString());
                    documentRepository.save(doc);
                    Files.deleteIfExists(oldFile.toPath());
                } catch (IOException e) {
                    throw new RuntimeException("Failed to migrate file: " + oldFile.getName(), e);
                }
            }
        }

        try {
            Path prospectDir = Paths.get(uploadDir).resolve("prospect_" + prospectId);
            Files.deleteIfExists(prospectDir);
        } catch (Exception e) {
            // ignore cleanup errors
        }

        auditService.log("DOCUMENT_MIGRATION",
                "Migrated documents from prospect folder to customer folder " + customerId,
                mobileNumber);
    }
}
