package com.trackflow.module.form.dto;

import com.trackflow.module.form.entity.FieldStatus;

import java.util.UUID;

public record FormFieldResponse(
        UUID id,
        String fieldName,
        String extractedValue,
        String confirmedValue,
        FieldStatus fieldStatus
) {}
