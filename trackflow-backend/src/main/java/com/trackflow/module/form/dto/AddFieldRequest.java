package com.trackflow.module.form.dto;

import jakarta.validation.constraints.NotBlank;

public record AddFieldRequest(
        @NotBlank String fieldName,
        @NotBlank String extractedValue
) {}
