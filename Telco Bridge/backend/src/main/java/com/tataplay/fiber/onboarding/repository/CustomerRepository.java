package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByMobileNumber(String mobileNumber);
    Optional<Customer> findByCustomerId(String customerId);
    Optional<Customer> findByProspectId(String prospectId);
    Optional<Customer> findByEmail(String email);
    boolean existsByMobileNumber(String mobileNumber);
    boolean existsByEmail(String email);
}
