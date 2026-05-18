package com.trackflow.module.validation.controller;

import com.trackflow.module.validation.dto.SuggestionDecisionRequest;
import com.trackflow.module.validation.dto.SuggestionDecisionResponse;
import com.trackflow.module.validation.service.ValidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final ValidationService validationService;

    @PatchMapping("/{id}/decide")
    @PreAuthorize("hasRole('FIELD_SUPERVISOR')")
    public ResponseEntity<SuggestionDecisionResponse> decide(
            @PathVariable UUID id,
            @Valid @RequestBody SuggestionDecisionRequest request) {
        return ResponseEntity.ok(validationService.decideSuggestion(id, request));
    }
}
