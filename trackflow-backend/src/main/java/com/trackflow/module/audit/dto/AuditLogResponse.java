package com.trackflow.module.audit.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String action,
        UUID performedById,
        String performedByName,
        String oldValue,
        String newValue,
        LocalDateTime createdAt
) {}
