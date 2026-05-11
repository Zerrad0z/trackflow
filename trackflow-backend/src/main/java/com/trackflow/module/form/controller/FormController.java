package com.trackflow.module.form.controller;

import com.trackflow.module.form.dto.FormResponse;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.form.service.FormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
}