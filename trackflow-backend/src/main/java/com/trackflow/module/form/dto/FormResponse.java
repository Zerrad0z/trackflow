package com.trackflow.module.form.dto;

import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.user.dto.UserResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public record FormResponse(
        UUID id,
        FormType formType,
        FormStatus formStatus,
        Boolean validatedByManager,
        UserResponse validatedByManagerBy,
        String scanUrl,
        LocalDateTime uploadedAt,
        LocalDateTime confirmedAt,
        UserResponse uploadedBy,
        UserResponse confirmedBy
) {}