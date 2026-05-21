package com.trackflow.module.validation.dto;

import com.trackflow.module.validation.entity.ValidationStatus;

import java.util.UUID;

public record ValidationCompleteEvent(
        UUID formId,
        UUID validationId,
        UUID uploadedById,
        String formType,
        ValidationStatus status,
        int suggestionCount
) {}
