package com.trackflow.module.notification.dto;

import com.trackflow.module.notification.entity.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String message,
        NotificationType notificationType,
        UUID referenceId,
        Boolean isRead,
        LocalDateTime sentAt
) {}