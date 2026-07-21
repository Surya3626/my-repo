package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.entity.Invoice;
import com.tataplay.fiber.onboarding.entity.Payment;

import java.util.List;

public interface PaymentService {
    Payment processPayment(String mobileNumber, String paymentMode, String couponCode);
    Invoice getInvoiceByPayment(Long paymentId);
    List<Invoice> getInvoicesByMobile(String mobileNumber);
}
