package com.trackflow.module.validation.dto;

import com.trackflow.module.validation.entity.ValidationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ValidationResponse(
        UUID id,
        UUID formId,
        ValidationStatus status,
        Boolean isLatest,
        LocalDateTime runAt,
        List<FieldSuggestionResponse> suggestions
) {}

