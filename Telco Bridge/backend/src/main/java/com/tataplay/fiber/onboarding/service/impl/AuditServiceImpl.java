package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.config.CorrelationFilter;
import com.tataplay.fiber.onboarding.entity.AuditLog;
import com.tataplay.fiber.onboarding.repository.AuditLogRepository;
import com.tataplay.fiber.onboarding.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final HttpServletRequest request;

    @Override
    @Transactional
    public void log(String action, String description, String actor) {
        String ipAddress = request.getRemoteAddr();
        String correlationId = CorrelationFilter.getCorrelationId();

        AuditLog log = AuditLog.builder()
                .action(action)
                .description(description)
                .actor(actor != null ? actor : "SYSTEM")
                .ipAddress(ipAddress)
                .correlationId(correlationId)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }

    @Override
    public List<AuditLog> getLogs() {
        return auditLogRepository.findFirst100ByOrderByTimestampDesc();
    }
}
