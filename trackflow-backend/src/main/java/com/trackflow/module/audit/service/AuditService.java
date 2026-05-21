package com.trackflow.module.audit.service;

import com.trackflow.module.audit.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AuditService {
    void log(String entityType, UUID entityId, String action,
             Object oldValue, Object newValue);
    Page<AuditLogResponse> getLogs(String entityType, Pageable pageable);
    Page<AuditLogResponse> getEntityLogs(String entityType, UUID entityId, Pageable pageable);
}