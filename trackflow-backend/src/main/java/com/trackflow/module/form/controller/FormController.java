package com.trackflow.module.form.controller;

import com.trackflow.module.form.dto.AddFieldRequest;
import com.trackflow.module.form.dto.FormFieldResponse;
import com.trackflow.module.form.dto.FormFieldSchemaResponse;
import com.trackflow.module.form.dto.FormResponse;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.form.service.FormService;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/forms")
@RequiredArgsConstructor
public class FormController {

    private final FormService formService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FIELD_SUPERVISOR')")
    public ResponseEntity<FormResponse> uploadForm(
            @RequestParam("file") MultipartFile file,
            @RequestParam("formType") FormType formType) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(formService.uploadForm(file, formType));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FIELD_SUPERVISOR', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Page<FormResponse>> getForms(
            @RequestParam(required = false) FormType formType,
            @RequestParam(required = false) FormStatus formStatus,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) UUID uploadedById,
            @RequestParam(required = false) String actName,
            Pageable pageable) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();

        if (user.getRole() == UserRole.FIELD_SUPERVISOR) {
            return ResponseEntity.ok(formService.getMyForms(pageable));
        }

        LocalDateTime fromDate = from != null ?
                LocalDate.parse(from).atStartOfDay() : null;
        LocalDateTime toDate = to != null ?
                LocalDate.parse(to).atTime(23, 59, 59) : null;

        return ResponseEntity.ok(formService.getFormsWithFilters(
                formType, formStatus, fromDate, toDate, uploadedById, actName, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FIELD_SUPERVISOR', 'MANAGER', 'ADMIN')")
    public ResponseEntity<FormResponse> getFormById(@PathVariable UUID id) {
        return ResponseEntity.ok(formService.getFormById(id));
    }

    @GetMapping("/{id}/fields")
    @PreAuthorize("hasAnyRole('FIELD_SUPERVISOR', 'MANAGER')")
    public ResponseEntity<List<FormFieldResponse>> getFormFields(@PathVariable UUID id) {
        return ResponseEntity.ok(formService.getFormFields(id));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('FIELD_SUPERVISOR')")
    public ResponseEntity<FormResponse> confirmForm(@PathVariable UUID id) {
        return ResponseEntity.ok(formService.confirmForm(id));
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('FIELD_SUPERVISOR', 'MANAGER')")
    public ResponseEntity<FormResponse> archiveForm(@PathVariable UUID id) {
        return ResponseEntity.ok(formService.archiveForm(id));
    }

    @GetMapping("/schemas/{formType}")
    public ResponseEntity<List<FormFieldSchemaResponse>> getSchema(
            @PathVariable FormType formType) {
        return ResponseEntity.ok(formService.getFormSchema(formType));
    }

    @PostMapping("/{id}/fields")
    @PreAuthorize("hasRole('FIELD_SUPERVISOR')")
    public ResponseEntity<FormFieldResponse> addField(
            @PathVariable UUID id,
            @RequestBody AddFieldRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(formService.addField(id, request));
    }
}