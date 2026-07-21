package com.tataplay.fiber.onboarding.controller;

import com.tataplay.fiber.onboarding.dto.ApiResponse;
import com.tataplay.fiber.onboarding.entity.Invoice;
import com.tataplay.fiber.onboarding.entity.Payment;
import com.tataplay.fiber.onboarding.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<Payment>> processPayment(@RequestBody Map<String, String> payload) {
        String paymentMode = payload.get("paymentMode");
        String couponCode = payload.get("couponCode");

        if (paymentMode == null || paymentMode.trim().isEmpty()) {
            throw new RuntimeException("Payment mode is required");
        }

        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        Payment payment = paymentService.processPayment(mobileNumber, paymentMode, couponCode);
        return ResponseEntity.ok(ApiResponse.success("Payment completed successfully", payment));
    }

    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<Invoice>>> listInvoices() {
        String mobileNumber = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Invoice> invoices = paymentService.getInvoicesByMobile(mobileNumber);
        return ResponseEntity.ok(ApiResponse.success("Invoices retrieved successfully", invoices));
    }
}
