package com.trackflow.module.validation.dto;

import com.trackflow.module.validation.entity.SuggestionDecision;
import jakarta.validation.constraints.NotNull;

public record SuggestionDecisionRequest(
        @NotNull(message = "Decision is required")
        SuggestionDecision decision,
        String overrideValue
) {}