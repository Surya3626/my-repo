package com.tataplay.fiber.onboarding.repository;

import com.tataplay.fiber.onboarding.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorOrderByTimestampDesc(String actor);
    List<AuditLog> findFirst100ByOrderByTimestampDesc();
}
