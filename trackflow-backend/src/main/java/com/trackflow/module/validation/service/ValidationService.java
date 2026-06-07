package com.trackflow.module.validation.service;

import com.trackflow.module.validation.dto.SuggestionDecisionRequest;
import com.trackflow.module.validation.dto.SuggestionDecisionResponse;
import com.trackflow.module.validation.dto.ValidationResponse;

import java.util.List;
import java.util.UUID;

public interface ValidationService {
    void processFormValidation(UUID formId);
    void processFormValidation(UUID formId, UUID triggeredByUserId);
    ValidationResponse getLatestValidation(UUID formId);
    List<ValidationResponse> getValidationHistory(UUID formId);
    SuggestionDecisionResponse decideSuggestion(UUID suggestionId, SuggestionDecisionRequest request);
}