package com.trackflow.module.validation.controller;

import com.trackflow.module.user.entity.User;
import com.trackflow.module.validation.dto.ValidationResponse;
import com.trackflow.module.validation.service.ValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/forms/{formId}/validations")
@RequiredArgsConstructor
public class ValidationController {

    private final ValidationService validationService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> triggerValidation(@PathVariable UUID formId) {
        User currentUser = (User) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        validationService.processFormValidation(formId, currentUser.getId());
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