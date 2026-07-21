package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCustomerId(Long customerId);
    Optional<Payment> findByTransactionId(String transactionId);
}
