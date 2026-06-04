package com.trackflow.module.form.dto;

import jakarta.validation.constraints.NotBlank;

public record FieldUpdateRequest(
        @NotBlank String fieldName,
        String value
) {}
