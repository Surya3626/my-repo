package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.entity.*;
import com.tataplay.fiber.onboarding.repository.*;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.CustomerService;
import com.tataplay.fiber.onboarding.service.DocumentService;
import com.tataplay.fiber.onboarding.service.PaymentService;
import com.tataplay.fiber.onboarding.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerService customerService;
    private final CustomerRepository customerRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanService planService;
    private final DocumentService documentService;
    private final AuditService auditService;

    @Override
    @Transactional
    public Payment processPayment(String mobileNumber, String paymentMode, String couponCode) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);

        Subscription subscription = subscriptionRepository.findByCustomerId(customer.getId())
                .orElseThrow(() -> new RuntimeException("No selected plan found. Please select a plan first."));

        BroadbandPlan plan = subscription.getPlan();

        double monthlyPrice = plan.getMonthlyPrice() != null ? plan.getMonthlyPrice() : plan.getPrice();
        int cycleMonths = subscription.getBillingCycleMonths() != null ? subscription.getBillingCycleMonths() : 1;

        double planCyclePrice = cycleMonths == 12 ? (plan.getAnnualPrice() != null ? plan.getAnnualPrice() : monthlyPrice * 12 * 0.8)
                : cycleMonths == 6 ? (plan.getSemiAnnualPrice() != null ? plan.getSemiAnnualPrice() : monthlyPrice * 6 * 0.9)
                : cycleMonths == 3 ? (plan.getQuarterlyPrice() != null ? plan.getQuarterlyPrice() : monthlyPrice * 3 * 0.95)
                : monthlyPrice;

        double securityDeposit = subscription.getSecurityDeposit() != null ? subscription.getSecurityDeposit() : (cycleMonths >= 6 ? 0.0 : 1000.0);
        double installation = (cycleMonths >= 6 || "ENTERPRISE".equals(subscription.getCustomerCategory())) ? 0.0 : (plan.getInstallationCharges() != null ? plan.getInstallationCharges() : 500.0);
        double discount = 0.0;

        if (couponCode != null && !couponCode.trim().isEmpty()) {
            discount = planService.calculateSafeDiscount(couponCode, planCyclePrice, subscription.getCustomerCategory());
        }

        double taxableAmount = Math.max(0.0, planCyclePrice - discount);
        double tax = taxableAmount * 0.18; // 18% GST standard telecom tax
        double totalAmount = taxableAmount + tax + installation + securityDeposit;

        String transactionId = "TXN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .customer(customer)
                .transactionId(transactionId)
                .paymentMode(paymentMode)
                .amount(totalAmount)
                .tax(tax)
                .discount(discount)
                .couponCode(couponCode)
                .status("SUCCESS")
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Update active subscription dates
        subscription.setStatus("ACTIVE");
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(LocalDateTime.now().plusDays(plan.getValidityDays()));
        subscriptionRepository.save(subscription);

        // Generate Invoice
        int randomInv = (int) (Math.random() * 900000) + 100000;
        String invoiceNumber = "TPF-INV-" + randomInv;

        Invoice invoice = Invoice.builder()
                .customer(customer)
                .payment(savedPayment)
                .invoiceNumber(invoiceNumber)
                .amount(totalAmount)
                .generatedDate(LocalDateTime.now())
                .build();

        invoiceRepository.save(invoice);

        // Advance customer onboarding status
        customer.setStatus(CustomerStatus.PAYMENT_COMPLETED);
        customerRepository.save(customer);

        // Document Migration (backend process, no UI)
        try {
            documentService.migrateDocumentsToCustomerId(mobileNumber);
        } catch (Exception e) {
            // log and continue (e.g. if no files uploaded)
        }

        auditService.log("PAYMENT_SUCCESS",
                "Payment of Rs. " + String.format("%.2f", totalAmount) + " processed successfully. Txn: "
                        + transactionId,
                mobileNumber);

        return savedPayment;
    }

    @Override
    public Invoice getInvoiceByPayment(Long paymentId) {
        return invoiceRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new RuntimeException("Invoice not found for payment ID: " + paymentId));
    }

    @Override
    public List<Invoice> getInvoicesByMobile(String mobileNumber) {
        Customer customer = customerService.getByMobileNumber(mobileNumber);
        return invoiceRepository.findByCustomerId(customer.getId());
    }
}
