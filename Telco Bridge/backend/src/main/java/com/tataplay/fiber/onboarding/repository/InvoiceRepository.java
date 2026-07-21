package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByCustomerId(Long customerId);
    Optional<Invoice> findByPaymentId(Long paymentId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}
