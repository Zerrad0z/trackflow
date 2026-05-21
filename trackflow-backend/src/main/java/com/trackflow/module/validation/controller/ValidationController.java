package com.trackflow.module.validation.controller;

import com.trackflow.module.validation.dto.ValidationResponse;
import com.trackflow.module.validation.service.ValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/forms/{formId}/validations")
@RequiredArgsConstructor
public class ValidationController {

    private final ValidationService validationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FIELD_SUPERVISOR', 'MANAGER')")
    public ResponseEntity<Void> triggerValidation(@PathVariable UUID formId) {
        validationService.processFormValidation(formId);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyRole('FIELD_SUPERVISOR', 'MANAGER')")
    public ResponseEntity<ValidationResponse> getLatest(@PathVariable UUID formId) {
        return ResponseEntity.ok(validationService.getLatestValidation(formId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FIELD_SUPERVISOR', 'MANAGER')")
    public ResponseEntity<List<ValidationResponse>> getHistory(@PathVariable UUID formId) {
        return ResponseEntity.ok(validationService.getValidationHistory(formId));
    }
}