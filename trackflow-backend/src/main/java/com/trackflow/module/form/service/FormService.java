package com.trackflow.module.form.service;

import com.trackflow.module.form.dto.*;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.entity.FormType;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface FormService {
    FormResponse uploadForm(MultipartFile file, FormType formType);
    Page<FormResponse> getMyForms(Pageable pageable);
    Page<FormResponse> getAllForms(Pageable pageable);
    FormResponse getFormById(UUID id);
    List<FormFieldResponse> getFormFields(UUID formId);
    FormResponse confirmForm(UUID id);
    FormResponse archiveForm(UUID id);
    List<FormFieldSchemaResponse> getFormSchema(FormType formType);
    Page<FormResponse> getFormsWithFilters(
            FormType formType, FormStatus formStatus,
            LocalDateTime from, LocalDateTime to,
            UUID uploadedById, String actName,
            Pageable pageable);

    @Transactional
    FormFieldResponse addField(UUID formId, AddFieldRequest request);
    Resource exportFormsToExcel(FormType formType, FormStatus formStatus,
                                LocalDateTime from, LocalDateTime to, String actName);

    @Transactional
    void updateInfractionStatus(UUID formId, InfractionStatusRequest request);

    @Transactional
    void updateFields(UUID formId, List<FieldUpdateRequest> updates);
}