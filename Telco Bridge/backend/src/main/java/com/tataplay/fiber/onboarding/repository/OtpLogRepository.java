package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.OtpLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpLogRepository extends JpaRepository<OtpLog, Long> {
    Optional<OtpLog> findFirstByMobileNumberOrderByCreatedAtDesc(String mobileNumber);
}
