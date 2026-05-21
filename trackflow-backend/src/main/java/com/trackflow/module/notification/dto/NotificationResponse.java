package com.trackflow.module.notification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String message,
        Boolean isRead,
        LocalDateTime sentAt
) {}