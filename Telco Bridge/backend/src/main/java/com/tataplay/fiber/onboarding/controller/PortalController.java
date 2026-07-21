package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.entity.*;
import com.tataplay.fiber.onboarding.repository.*;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.CustomerService;
import com.tataplay.fiber.onboarding.service.DocumentService;
import com.tataplay.fiber.onboarding.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/customer/portal")
@RequiredArgsConstructor
public class PortalController {

    private final CustomerService customerService;
    private final AddressRepository addressRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InstallationTicketRepository ticketRepository;
    private final DocumentRepository documentRepository;
    private final FeedbackRepository feedbackRepository;
    private final PaymentRepository paymentRepository;
    private final BroadbandPlanRepository planRepository;
    private final DocumentService documentService;
    private final OtpService otpService;
    private final AuditService auditService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        Optional<Address> address = addressRepository.findByCustomerId(customer.getId());
        Optional<Subscription> subscription = subscriptionRepository.findByCustomerId(customer.getId());
        Optional<InstallationTicket> ticket = ticketRepository.findByCustomerId(customer.getId());
        List<Document> documents = documentRepository.findByCustomerId(customer.getId());

        Map<String, Object> data = new HashMap<>();
        data.put("profile", customer);
        data.put("address", address.orElse(null));
        data.put("subscription", subscription.orElse(null));
        data.put("ticket", ticket.orElse(null));
        data.put("documents", documents);

        return ResponseEntity.ok(ApiResponse.success("Dashboard data loaded successfully", data));
    }

    @PostMapping("/address")
    public ResponseEntity<ApiResponse<Customer>> saveAddress(@RequestBody Address address) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.saveAddress(mobileNumber, address);
        return ResponseEntity.ok(ApiResponse.success("Address saved successfully", customer));
    }

    @PostMapping("/plan/select")
    public ResponseEntity<ApiResponse<Customer>> selectPlan(@RequestParam Long planId) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.assignPlan(mobileNumber, planId);
        customer = customerService.createAccountAndCustomer(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Plan selected successfully and account created", customer));
    }

    @PostMapping("/relocate")
    public ResponseEntity<ApiResponse<Void>> requestRelocation(@RequestBody Map<String, String> payload) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        String newAddress = payload.get("newAddress");
        
        auditService.log("RELOCATION_REQUESTED", "Customer requested relocation to: " + newAddress, mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Relocation request raised. Support will call you in 24 hours."));
    }

    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<Feedback>> submitFeedback(@RequestBody Map<String, Object> payload) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        Integer rating = (Integer) payload.get("rating");
        String comments = (String) payload.get("comments");

        if (rating == null || rating < 1 || rating > 5) {
            throw new RuntimeException("Invalid rating. Must be between 1 and 5.");
        }

        Feedback feedback = Feedback.builder()
                .customer(customer)
                .rating(rating)
                .comments(comments)
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        
        // Mark customer status as COMPLETED after they give feedback
        customer.setStatus(CustomerStatus.COMPLETED);
        customerService.updateStatus(mobileNumber, CustomerStatus.COMPLETED);

        auditService.log("FEEDBACK_SUBMITTED", "Customer rated connection onboarding: " + rating + "/5 stars", mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Feedback submitted. Welcome to TelcoBridge!", saved));

    }

    @PostMapping("/consent/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendConsentOtp() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        otpService.sendOtp(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Consent OTP sent successfully. Master bypass code is 123456"));
    }

    @PostMapping("/consent/verify")
    public ResponseEntity<ApiResponse<Void>> verifyConsentOtp(@RequestParam String otp) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean verified = otpService.verifyOtp(mobileNumber, otp);
        if (!verified) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid Consent OTP", null));
        }
        
        auditService.log("CONSENT_GIVEN", "Customer gave their consent for onboarding verification via OTP", mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Consent verification successful"));
    }

    @PostMapping("/caf/generate")
    public ResponseEntity<ApiResponse<Document>> generateCaf() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Document doc = documentService.generateCafForm(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("CAF document generated successfully", doc));
    }

    // ─── Account Recharge Endpoint (Backend Validated) ─────────────────────────

    @PostMapping("/recharge")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rechargeAccount(@RequestBody Map<String, Object> payload) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        Object amountObj = payload.get("amount");
        String paymentMode = (String) payload.get("paymentMode");
        Long planId = payload.get("planId") != null ? Long.valueOf(payload.get("planId").toString()) : null;
        Integer months = payload.get("months") != null ? Integer.valueOf(payload.get("months").toString()) : 1;

        if (amountObj == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Recharge amount is required.", null));
        }
        Double amount = Double.valueOf(amountObj.toString());
        if (amount < 100.0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Minimum recharge amount is ₹100.", null));
        }

        if (paymentMode == null || paymentMode.trim().isEmpty()) {
            paymentMode = "UPI";
        }

        // If planId provided, update subscription plan
        Subscription subscription = subscriptionRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> Subscription.builder().customer(customer).status("ACTIVE").build());

        if (planId != null) {
            Optional<BroadbandPlan> planOpt = planRepository.findById(planId);
            planOpt.ifPresent(subscription::setPlan);
        }

        // Calculate subscription extension
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentEnd = subscription.getEndDate();
        LocalDateTime newEnd = (currentEnd != null && currentEnd.isAfter(now)) 
                ? currentEnd.plusMonths(months) 
                : now.plusMonths(months);

        subscription.setStartDate(subscription.getStartDate() == null ? now : subscription.getStartDate());
        subscription.setEndDate(newEnd);
        subscription.setStatus("ACTIVE");
        subscriptionRepository.save(subscription);

        // Record Payment transaction entity
        String txnId = "TXN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Payment payment = Payment.builder()
                .customer(customer)
                .transactionId(txnId)
                .paymentMode(paymentMode)
                .amount(amount)
                .tax(amount * 0.18) // 18% GST calculation
                .discount(0.0)
                .status("SUCCESS")
                .build();
        Payment savedPayment = paymentRepository.save(payment);

        auditService.log("ACCOUNT_RECHARGED", 
                String.format("Customer recharged ₹%.2f via %s. Transaction ID: %s. New expiry: %s", 
                        amount, paymentMode, txnId, newEnd.toLocalDate()), mobileNumber);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("payment", savedPayment);
        responseData.put("subscription", subscription);

        return ResponseEntity.ok(ApiResponse.success("Account recharged successfully!", responseData));
    }

    // ─── Plan Change / Upgrade Endpoint ───────────────────────────────

    @PostMapping("/plan/change")
    public ResponseEntity<ApiResponse<Subscription>> changePlan(@RequestBody Map<String, Long> payload) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        Long newPlanId = payload.get("planId");
        if (newPlanId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Plan ID is required.", null));
        }

        BroadbandPlan plan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new RuntimeException("Selected plan not found with ID: " + newPlanId));

        Subscription subscription = subscriptionRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> Subscription.builder().customer(customer).status("ACTIVE").build());

        subscription.setPlan(plan);
        subscription.setStatus("ACTIVE");
        Subscription saved = subscriptionRepository.save(subscription);

        auditService.log("PLAN_CHANGED", "Customer upgraded/migrated plan to: " + plan.getName(), mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Plan updated successfully to " + plan.getName(), saved));
    }

    // ─── Temporary Vacation Hold / Suspension Endpoint ─────────────────

    @PostMapping("/suspend")
    public ResponseEntity<ApiResponse<Void>> requestSuspension(@RequestBody Map<String, Object> payload) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        Integer durationDays = payload.get("durationDays") != null ? Integer.valueOf(payload.get("durationDays").toString()) : 14;
        String reason = payload.get("reason") != null ? payload.get("reason").toString() : "Vacation / Travel";

        if (durationDays < 7 || durationDays > 90) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vacation hold duration must be between 7 and 90 days.", null));
        }

        Optional<Subscription> subOpt = subscriptionRepository.findByCustomerId(customer.getId());
        if (subOpt.isPresent()) {
            Subscription sub = subOpt.get();
            sub.setStatus("SUSPENDED");
            subscriptionRepository.save(sub);
        }

        auditService.log("VACATION_HOLD_REQUESTED", 
                String.format("Customer requested connection hold for %d days. Reason: %s", durationDays, reason), mobileNumber);

        return ResponseEntity.ok(ApiResponse.success("Connection put on Vacation Hold for " + durationDays + " days. Zero rental will apply during hold period."));
    }

    // ─── Support Ticket Creation Endpoint ──────────────────────────────

    @PostMapping("/ticket/create")
    public ResponseEntity<ApiResponse<InstallationTicket>> createSupportTicket(@RequestBody Map<String, String> payload) {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        String category = payload.get("category");
        String description = payload.get("description");

        if (category == null || category.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Ticket category is required.", null));
        }
        if (description == null || description.trim().length() < 5) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Ticket description must be at least 5 characters.", null));
        }

        String ticketNo = "TKT" + System.currentTimeMillis() % 1000000;
        InstallationTicket ticket = InstallationTicket.builder()
                .customer(customer)
                .ticketNumber(ticketNo)
                .status("OPEN")
                .appointmentDate(LocalDateTime.now())
                .expectedInstallationDate(LocalDateTime.now().plusHours(2))
                .engineerName("Assigned Dispatch Team")
                .engineerPhone("+91 1800 209 0000")
                .build();

        InstallationTicket savedTicket = ticketRepository.save(ticket);
        auditService.log("SUPPORT_TICKET_CREATED", 
                String.format("Support ticket created: %s | Category: %s | Description: %s", ticketNo, category, description), mobileNumber);

        return ResponseEntity.ok(ApiResponse.success("Support ticket #" + ticketNo + " created successfully. SLA response: 2 Hours.", savedTicket));
    }

    // ─── Payment & Invoice History Endpoint ─────────────────────────────

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentHistory() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        List<Payment> payments = paymentRepository.findByCustomerId(customer.getId());
        return ResponseEntity.ok(ApiResponse.success("Payments fetched successfully", payments));
    }
}
