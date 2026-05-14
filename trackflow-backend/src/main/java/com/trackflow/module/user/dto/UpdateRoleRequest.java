package com.trackflow.module.user.dto;

import com.trackflow.module.user.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull(message = "Role is required")
        UserRole role
) {}
