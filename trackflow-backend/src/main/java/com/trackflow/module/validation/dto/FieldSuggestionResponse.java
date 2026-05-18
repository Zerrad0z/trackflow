package com.trackflow.module.validation.dto;

import com.trackflow.module.validation.entity.SuggestionDecision;

import java.time.LocalDateTime;
import java.util.UUID;

public record FieldSuggestionResponse(
        UUID id,
        String fieldName,
        String extractedValue,
        String suggestedValue,
        Float confidence,
        String reason,
        SuggestionDecision decision,
        LocalDateTime decidedAt
) {}
