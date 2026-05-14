package com.trackflow.module.user.dto;

import com.trackflow.module.user.entity.UserRole;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String email,
        UserRole role,
        Boolean isActive,
        LocalDateTime createdAt
) {}