package com.trackflow.module.form.dto;

public record FormFieldSchemaResponse(
        String fieldName,
        String fieldLabel,
        String fieldType,
        Boolean isRequired,
        Integer sortOrder
) {}