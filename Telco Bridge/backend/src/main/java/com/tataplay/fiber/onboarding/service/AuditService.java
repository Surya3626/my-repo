package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.entity.AuditLog;

import java.util.List;

public interface AuditService {
    void log(String action, String description, String actor);
    List<AuditLog> getLogs();
}
