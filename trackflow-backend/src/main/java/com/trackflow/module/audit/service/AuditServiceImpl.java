package com.trackflow.module.audit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackflow.module.audit.entity.AuditLog;
import com.trackflow.module.audit.repository.AuditLogRepository;
import com.trackflow.module.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Async
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
}
