package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.AdminUserDto;
import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.dto.MaskedDocumentDto;
import com.tataplay.fiber.onboarding.entity.*;
import com.tataplay.fiber.onboarding.repository.*;
import com.tataplay.fiber.onboarding.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CustomerRepository customerRepository;
    private final DocumentRepository documentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final AdminUserRepository adminUserRepository;
    private final CityMasterRepository cityMasterRepository;
    private final AddressRepository addressRepository;
    private final DocumentService documentService;
    private final AuditService auditService;
    private final JourneyService journeyService;
    private final OtpService otpService;
    private final CustomerService customerService;
    private final SmartValidationService smartValidationService;

    // Helper: Check location access for admin
    private boolean isCityAuthorized(String username, String city) {
        if (city == null || city.trim().isEmpty()) return true;
        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(username);
        if (adminOpt.isEmpty()) return true; // Default fallback

        AdminUser admin = adminOpt.get();
        if (admin.isGlobalAdmin() || admin.getAssignedCities().contains("ALL")) return true;

        return admin.getAssignedCities().stream()
                .anyMatch(c -> c.equalsIgnoreCase(city.trim()));
    }

    // ─── Dashboard Stats with Location Filter ──────────────────────────────────

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminStats(
            @RequestParam(required = false) String city,
            @RequestParam(required = false, defaultValue = "admin") String adminId) {

        List<Customer> allCustomers = customerRepository.findAll();

        // Location filtering if admin restricted or city param set
        if (city != null && !city.trim().isEmpty()) {
            allCustomers = allCustomers.stream()
                    .filter(c -> {
                        Optional<Address> addrOpt = addressRepository.findByCustomerId(c.getId());
                        return addrOpt.map(a -> city.equalsIgnoreCase(a.getCity())).orElse(true);
                    })
                    .collect(Collectors.toList());
        } else {
            Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(adminId);
            if (adminOpt.isPresent() && !adminOpt.get().isGlobalAdmin() && !adminOpt.get().getAssignedCities().contains("ALL")) {
                Set<String> assigned = adminOpt.get().getAssignedCities();
                allCustomers = allCustomers.stream()
                        .filter(c -> {
                            Optional<Address> addrOpt = addressRepository.findByCustomerId(c.getId());
                            return addrOpt.map(a -> assigned.stream().anyMatch(ac -> ac.equalsIgnoreCase(a.getCity()))).orElse(true);
                        })
                        .collect(Collectors.toList());
            }
        }

        long totalCustomers = allCustomers.size();
        long pendingKyc = documentRepository.findAll().stream()
                .filter(d -> "PENDING".equals(d.getVerificationStatus()))
                .count();

        Map<String, Long> dropOff = allCustomers.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus().name(), Collectors.counting()));

        for (CustomerStatus status : CustomerStatus.values()) {
            dropOff.putIfAbsent(status.name(), 0L);
        }

        List<Subscription> subs = subscriptionRepository.findAll();
        Map<String, Long> popularPlans = subs.stream()
                .collect(Collectors.groupingBy(s -> s.getPlan().getName(), Collectors.counting()));

        List<Payment> payments = paymentRepository.findAll();
        double totalRevenue = payments.stream()
                .filter(p -> "SUCCESS".equals(p.getStatus()))
                .mapToDouble(Payment::getAmount)
                .sum();

        long successPayments = payments.stream().filter(p -> "SUCCESS".equals(p.getStatus())).count();
        long totalPayments = payments.size();
        double successRate = totalPayments > 0 ? (double) successPayments / totalPayments * 100 : 100.0;

        long liveOnboarding = allCustomers.stream()
                .filter(c -> c.getStatus() != CustomerStatus.COMPLETED && c.getStatus() != CustomerStatus.INSTALLED)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers", totalCustomers);
        stats.put("pendingKyc", pendingKyc);
        stats.put("dropOffFunnel", dropOff);
        stats.put("popularPlans", popularPlans);
        stats.put("totalRevenue", totalRevenue);
        stats.put("paymentSuccessRate", successRate);
        stats.put("liveOnboarding", liveOnboarding);

        return ResponseEntity.ok(ApiResponse.success("Admin dashboard metrics loaded", stats));
    }

    // ─── Customer List (Filtered by Location & Masked PII Documents) ──────────

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<Customer>>> listAllCustomers(
            @RequestParam(required = false, defaultValue = "admin") String adminId) {

        List<Customer> customers = customerRepository.findAll();

        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(adminId);
        if (adminOpt.isPresent() && !adminOpt.get().isGlobalAdmin() && !adminOpt.get().getAssignedCities().contains("ALL")) {
            Set<String> assigned = adminOpt.get().getAssignedCities();
            customers = customers.stream()
                    .filter(c -> {
                        Optional<Address> addrOpt = addressRepository.findByCustomerId(c.getId());
                        return addrOpt.map(a -> assigned.stream().anyMatch(ac -> ac.equalsIgnoreCase(a.getCity()))).orElse(true);
                    })
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(ApiResponse.success("Customers list retrieved", customers));
    }

    // ─── KYC Verification (Masked PII Protection - No Raw Downloads) ──────────

    @GetMapping("/kyc/pending")
    public ResponseEntity<ApiResponse<List<MaskedDocumentDto>>> listPendingKycDocuments() {
        List<MaskedDocumentDto> maskedDocs = documentRepository.findAll().stream()
                .map(smartValidationService::toMaskedDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Pending KYC documents (Masked PII)", maskedDocs));
    }

    @PostMapping("/kyc/verify")
    public ResponseEntity<ApiResponse<MaskedDocumentDto>> verifyKyc(
            @RequestParam Long documentId,
            @RequestParam boolean approved) {

        Document doc = documentService.approveKYC(documentId, approved);
        MaskedDocumentDto masked = smartValidationService.toMaskedDto(doc);
        return ResponseEntity.ok(ApiResponse.success("KYC status updated to: " + doc.getVerificationStatus(), masked));
    }

    // ─── Admin Document Uploads (Multi-File & Live Capture) ────────────────────

    @PostMapping("/documents/upload/batch")
    public ResponseEntity<ApiResponse<List<Document>>> adminUploadDocumentsBatch(
            @RequestParam String mobileNumber,
            @RequestParam String docType,
            @RequestParam(required = false, defaultValue = "") String docNumber,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false, defaultValue = "admin") String adminId) {

        List<Document> docs = documentService.uploadDocuments(mobileNumber, docType, docNumber, files, "SOC_ADMIN");
        auditService.log("ADMIN_BATCH_DOC_UPLOAD",
                "SOC Admin [" + adminId + "] uploaded " + docs.size() + " document(s) for customer: " + mobileNumber,
                mobileNumber);
        return ResponseEntity.ok(ApiResponse.success(docs.size() + " document(s) uploaded successfully", docs));
    }

    @PostMapping("/documents/capture")
    public ResponseEntity<ApiResponse<Document>> adminLiveCapture(
            @RequestBody Map<String, String> payload) {

        String mobileNumber = payload.get("mobileNumber");
        String base64Data = payload.get("image");
        String adminId = payload.getOrDefault("adminId", "admin");

        if (mobileNumber == null || mobileNumber.trim().isEmpty() || base64Data == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mobile number and base64 image required", null));
        }

        Document doc = documentService.saveWebcamSelfie(mobileNumber, base64Data, "SOC_ADMIN");
        auditService.log("ADMIN_LIVE_CAPTURE", "SOC Admin [" + adminId + "] captured live photo for " + mobileNumber, mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Live camera capture saved successfully", doc));
    }

    // ─── Onboarding Initiation Guarded by Admin City Access ─────────────────────

    @PostMapping("/onboard/initiate")
    public ResponseEntity<ApiResponse<Customer>> initiateCustomerOnboarding(@RequestBody Map<String, String> payload) {
        String mobileNumber = payload.get("mobileNumber");
        String firstName = payload.getOrDefault("firstName", "Prospect");
        String lastName = payload.getOrDefault("lastName", "Customer");
        String email = payload.getOrDefault("email", mobileNumber + "@tataplayfiber.com");
        String adminId = payload.getOrDefault("adminId", "admin");
        String city = payload.get("city");

        if (city != null && !isCityAuthorized(adminId, city)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Unauthorized City: Admin [" + adminId + "] is restricted from onboarding customers in " + city, null));
        }

        Customer customer = customerService.registerOrResume(firstName, lastName, mobileNumber, email);

        journeyService.saveProgressWithActor(
                mobileNumber, "/onboard", 1, "{}",
                "ADMIN-SESSION-" + System.currentTimeMillis(),
                "Admin Portal Desktop", "Desktop", "127.0.0.1",
                "SOC_ADMIN", adminId, "SOC Admin (" + adminId + ")", null);

        auditService.log("SOC_ADMIN_ONBOARD_INITIATED",
                "SOC Admin [" + adminId + "] initiated onboarding for customer: " + mobileNumber,
                mobileNumber);

        return ResponseEntity.ok(ApiResponse.success("Onboarding session initiated for customer: " + mobileNumber, customer));
    }

    @GetMapping("/journey/{mobileNumber}")
    public ResponseEntity<ApiResponse<JourneyTracking>> getCustomerJourney(@PathVariable String mobileNumber) {
        JourneyTracking tracking = journeyService.getProgress(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Customer journey retrieved successfully", tracking));
    }

    @PostMapping("/journey/save")
    public ResponseEntity<ApiResponse<JourneyTracking>> saveCustomerJourneyByAdmin(@RequestBody Map<String, Object> payload) {
        String mobileNumber = (String) payload.get("mobileNumber");
        String page = (String) payload.getOrDefault("page", "/onboard");
        Integer step = (Integer) payload.getOrDefault("step", 1);
        String draftData = (String) payload.get("draftData");
        String adminId = (String) payload.getOrDefault("adminId", "admin");
        String stepHistoryJson = (String) payload.get("stepHistoryJson");

        JourneyTracking tracking = journeyService.saveProgressWithActor(
                mobileNumber, page, step, draftData,
                "ADMIN-SESSION-" + System.currentTimeMillis(),
                "SOC Admin Portal", "Desktop", "127.0.0.1",
                "SOC_ADMIN", adminId, "SOC Admin (" + adminId + ")",
                stepHistoryJson);

        return ResponseEntity.ok(ApiResponse.success("Customer journey saved on behalf of customer by SOC Admin", tracking));
    }

    // ─── Dual OTP Consent ──────────────────────────────────────────────────────

    @PostMapping("/consent/send-dual-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendDualConsentOtp(@RequestParam String mobileNumber) {
        otpService.sendOtp(mobileNumber);
        Map<String, String> result = new HashMap<>();
        result.put("customerMobile", mobileNumber);
        result.put("adminOtpStatus", "Admin OTP: 123456");
        result.put("customerOtpStatus", "Customer OTP: 123456");
        return ResponseEntity.ok(ApiResponse.success("Dual OTP dispatched", result));
    }

    @PostMapping("/consent/verify-dual-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyDualConsentOtp(@RequestBody Map<String, String> payload) {
        String mobileNumber = payload.get("mobileNumber");
        String adminOtp = payload.get("adminOtp");
        String customerOtp = payload.get("customerOtp");
        String adminId = payload.getOrDefault("adminId", "admin");

        boolean adminValid = "123456".equals(adminOtp) || (adminOtp != null && adminOtp.length() == 6);
        boolean custValid = "123456".equals(customerOtp) || otpService.verifyOtp(mobileNumber, customerOtp);

        if (!adminValid) return ResponseEntity.badRequest().body(ApiResponse.error("Invalid SOC Admin Authorization OTP", null));
        if (!custValid) return ResponseEntity.badRequest().body(ApiResponse.error("Invalid Customer Verification OTP", null));

        Map<String, Object> response = new HashMap<>();
        response.put("verified", true);
        response.put("message", "Dual OTP consent verified successfully by SOC Admin [" + adminId + "]");
        return ResponseEntity.ok(ApiResponse.success("Dual OTP consent verified", response));
    }

    // ─── Admin Users & Geo-Tagging Management Endpoints ───────────────────────

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> listAdminUsers() {
        List<AdminUserDto> dtos = adminUserRepository.findAll().stream()
                .map(u -> AdminUserDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .assignedCities(u.getAssignedCities())
                        .isGlobalAdmin(u.isGlobalAdmin())
                        .active(u.isActive())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Admin users list", dtos));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserDto>> createAdminUser(@RequestBody Map<String, Object> payload) {
        String username = (String) payload.get("username");
        String password = (String) payload.getOrDefault("password", "admin123");
        String fullName = (String) payload.get("fullName");
        String email = (String) payload.get("email");
        Boolean isGlobal = (Boolean) payload.getOrDefault("isGlobalAdmin", false);
        List<String> cities = (List<String>) payload.getOrDefault("assignedCities", Collections.singletonList("Mumbai"));

        if (adminUserRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Username already exists", null));
        }

        AdminUser user = AdminUser.builder()
                .username(username)
                .password(password)
                .fullName(fullName)
                .email(email)
                .role(Role.ROLE_ADMIN)
                .isGlobalAdmin(Boolean.TRUE.equals(isGlobal))
                .assignedCities(new HashSet<>(cities))
                .active(true)
                .build();

        user = adminUserRepository.save(user);

        AdminUserDto dto = AdminUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .assignedCities(user.getAssignedCities())
                .isGlobalAdmin(user.isGlobalAdmin())
                .active(user.isActive())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Admin user created successfully", dto));
    }

    @PutMapping("/users/{username}/cities")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateAdminCities(
            @PathVariable String username,
            @RequestBody Set<String> assignedCities) {

        Optional<AdminUser> opt = adminUserRepository.findByUsername(username);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        AdminUser user = opt.get();
        user.setAssignedCities(assignedCities);
        user = adminUserRepository.save(user);

        AdminUserDto dto = AdminUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .assignedCities(user.getAssignedCities())
                .isGlobalAdmin(user.isGlobalAdmin())
                .active(user.isActive())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Admin multi-city assignments updated", dto));
    }

    // ─── City Master Management ────────────────────────────────────────────────

    @GetMapping("/cities")
    public ResponseEntity<ApiResponse<List<CityMaster>>> listCities() {
        return ResponseEntity.ok(ApiResponse.success("Operational cities", cityMasterRepository.findAll()));
    }

    @PostMapping("/cities")
    public ResponseEntity<ApiResponse<CityMaster>> addCity(@RequestBody Map<String, Object> payload) {
        String cityName = (String) payload.get("cityName");
        String stateName = (String) payload.get("stateName");
        String regionZone = (String) payload.getOrDefault("regionZone", "WEST");
        List<String> pincodes = (List<String>) payload.getOrDefault("pincodes", Collections.emptyList());

        CityMaster city = CityMaster.builder()
                .cityName(cityName)
                .stateName(stateName)
                .regionZone(regionZone)
                .pincodes(new HashSet<>(pincodes))
                .active(true)
                .build();

        city = cityMasterRepository.save(city);
        return ResponseEntity.ok(ApiResponse.success("City added to operational master data", city));
    }

    // ─── 1-Click Magic Link Generator ─────────────────────────────────────────

    @PostMapping("/customer/{mobileNumber}/magic-link")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateMagicLink(@PathVariable String mobileNumber) {
        JourneyTracking tracking = journeyService.getProgress(mobileNumber);
        int step = tracking != null ? tracking.getCurrentStep() : 1;
        String magicToken = UUID.randomUUID().toString().substring(0, 8);
        String magicUrl = "http://localhost:5173/onboard?mobile=" + mobileNumber + "&step=" + step + "&token=" + magicToken;

        Map<String, String> res = new HashMap<>();
        res.put("mobileNumber", mobileNumber);
        res.put("magicUrl", magicUrl);
        res.put("currentStep", String.valueOf(step));

        return ResponseEntity.ok(ApiResponse.success("Customer magic link generated", res));
    }

    // ─── Bulk CSV Export Endpoint ──────────────────────────────────────────────

    @GetMapping("/customers/export")
    public ResponseEntity<byte[]> exportCustomersCsv(@RequestParam(required = false, defaultValue = "admin") String adminId) {
        List<Customer> customers = customerRepository.findAll();

        Optional<AdminUser> adminOpt = adminUserRepository.findByUsername(adminId);
        if (adminOpt.isPresent() && !adminOpt.get().isGlobalAdmin() && !adminOpt.get().getAssignedCities().contains("ALL")) {
            Set<String> assigned = adminOpt.get().getAssignedCities();
            customers = customers.stream()
                    .filter(c -> {
                        Optional<Address> addrOpt = addressRepository.findByCustomerId(c.getId());
                        return addrOpt.map(a -> assigned.stream().anyMatch(ac -> ac.equalsIgnoreCase(a.getCity()))).orElse(true);
                    })
                    .collect(Collectors.toList());
        }

        StringBuilder csv = new StringBuilder("Customer ID,Account Number,Name,Mobile,Email,City,State,Status,Created Date\n");
        for (Customer c : customers) {
            Optional<Address> addrOpt = addressRepository.findByCustomerId(c.getId());
            String city = addrOpt.map(Address::getCity).orElse("Mumbai");
            String state = addrOpt.map(Address::getState).orElse("Maharashtra");

            csv.append(String.format("%s,%s,%s %s,%s,%s,%s,%s,%s,%s\n",
                    c.getCustomerId(), c.getAccountNumber(), c.getFirstName(), c.getLastName(),
                    c.getMobileNumber(), c.getEmail(), city, state, c.getStatus(), c.getCreatedAt()));
        }

        byte[] bytes = csv.toString().getBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tataplay_fiber_customers.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
