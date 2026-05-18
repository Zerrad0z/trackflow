package com.trackflow.module.validation.service;

import com.trackflow.module.validation.dto.ValidationResponse;

import java.util.List;
import java.util.UUID;

public interface ValidationService {
    void processFormValidation(UUID formId);
    ValidationResponse getLatestValidation(UUID formId);
    List<ValidationResponse> getValidationHistory(UUID formId);
}