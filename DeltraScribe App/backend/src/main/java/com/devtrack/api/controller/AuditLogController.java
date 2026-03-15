package com.devtrack.api.controller;

import com.devtrack.api.model.AuditLog;
import com.devtrack.api.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping("/{entityType}/{entityId}")
    public List<AuditLog> getAuditLogs(@PathVariable String entityType, @PathVariable Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType.toUpperCase(), entityId);
    }
}
