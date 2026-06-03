package com.trackflow.module.form.service;

import com.trackflow.module.form.dto.AddFieldRequest;
import com.trackflow.module.form.dto.FormFieldResponse;
import com.trackflow.module.form.dto.FormFieldSchemaResponse;
import com.trackflow.module.form.dto.FormResponse;
import com.trackflow.module.form.entity.FormType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    @Transactional
    FormFieldResponse addField(UUID formId, AddFieldRequest request);
}