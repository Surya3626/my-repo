package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.InstallationTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstallationTicketRepository extends JpaRepository<InstallationTicket, Long> {
    Optional<InstallationTicket> findByCustomerId(Long customerId);
    Optional<InstallationTicket> findByTicketNumber(String ticketNumber);
}
