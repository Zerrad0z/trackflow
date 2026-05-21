package com.trackflow.module.audit.service;

import java.util.UUID;

public interface AuditService {
    void log(String entityType, UUID entityId, String action,
             Object oldValue, Object newValue);
}