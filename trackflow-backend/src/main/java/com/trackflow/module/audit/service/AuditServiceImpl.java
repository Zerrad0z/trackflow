package com.trackflow.module.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackflow.module.audit.dto.AuditLogResponse;
import com.trackflow.module.audit.entity.AuditLog;
import com.trackflow.module.audit.repository.AuditLogRepository;
import com.trackflow.module.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void log(String entityType, UUID entityId, String action,
                    Object oldValue, Object newValue) {
        try {
            User currentUser = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User) {
                currentUser = (User) auth.getPrincipal();
            }

            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .performedBy(currentUser)
                    .oldValue(oldValue != null ?
                            objectMapper.writeValueAsString(oldValue) : null)
                    .newValue(newValue != null ?
                            objectMapper.writeValueAsString(newValue) : null)
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log saved: {} {} {}", entityType, entityId, action);

        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogs(String entityType, Pageable pageable) {
        Page<AuditLog> logs = entityType != null
                ? auditLogRepository.findByEntityType(entityType, pageable)
                : auditLogRepository.findAll(pageable);
        return logs.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getEntityLogs(String entityType,
                                                UUID entityId,
                                                Pageable pageable) {
        return auditLogRepository
                .findByEntityTypeAndEntityId(entityType, entityId, pageable)
                .map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getPerformedBy() != null ? log.getPerformedBy().getId() : null,
                log.getPerformedBy() != null ? log.getPerformedBy().getFullName() : "System",
                log.getOldValue(),
                log.getNewValue(),
                log.getCreatedAt()
        );
    }
}
