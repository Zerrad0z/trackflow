package com.trackflow.module.form.service;

import com.trackflow.common.exception.InvalidOperationException;
import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.module.form.dto.*;
import com.trackflow.module.form.entity.*;
import com.trackflow.module.form.event.FormSubmittedEvent;
import com.trackflow.module.form.repository.FormFieldRepository;
import com.trackflow.module.form.repository.FormFieldSchemaRepository;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.report.service.ExcelReportService;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import com.trackflow.module.user.repository.UserRepository;
import com.trackflow.module.validation.entity.AiValidation;
import com.trackflow.module.validation.entity.ValidationStatus;
import com.trackflow.module.validation.repository.AiValidationRepository;
import com.trackflow.module.validation.repository.FieldSuggestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FormServiceImpl implements FormService {

    private final FormRepository formRepository;
    private final FormFieldRepository formFieldRepository;
    private final StorageService storageService;
    private final FormMapper formMapper;
    private final RabbitTemplate rabbitTemplate;
    private final ApplicationEventPublisher eventPublisher;
    private final OcrService ocrService;
    private final GroqExtractionService groqExtractionService;
    private final FormFieldSchemaRepository formFieldSchemaRepository;
    private final ExcelReportService excelReportService;
    private final AiValidationRepository aiValidationRepository;
    private final FieldSuggestionRepository fieldSuggestionRepository;
    private final ExcelReportService excelExportService;

    @Override
    @Transactional
    public FormResponse uploadForm(MultipartFile file, FormType formType) {
        User currentUser = (User) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();

        // 1. Store file
        String filePath = storageService.storeFile(file);

        // 2. Create form
        Form form = Form.builder()
                .formType(formType)
                .formStatus(FormStatus.UPLOADED)
                .scanUrl(filePath)
                .uploadedAt(LocalDateTime.now())
                .uploadedBy(currentUser)
                .build();
        Form savedForm = formRepository.save(form);

        // 3. OCR extraction
        try {
            form.setFormStatus(FormStatus.OCR_PROCESSING);
            formRepository.save(form);

            String rawText = ocrService.extractText(filePath);

            if (!rawText.isBlank()) {
                // 4. Groq field extraction
                List<Map<String, String>> extractedFields =
                        groqExtractionService.extractFields(rawText, formType.name());

                // 5. Save FormField records
                List<FormField> fields = extractedFields.stream()
                        .filter(f -> {
                            String name = f.get("fieldName") != null
                                    ? f.get("fieldName")
                                    : f.get("field_name");
                            return name != null && !name.isBlank();
                        })
                        .map(f -> {
                            String name = f.get("fieldName") != null
                                    ? f.get("fieldName")
                                    : f.get("field_name");
                            String value = f.get("value") != null
                                    ? f.get("value")
                                    : f.get("extractedValue");
                            return FormField.builder()
                                    .form(savedForm)
                                    .fieldName(name)
                                    .extractedValue(value)
                                    .fieldStatus(FieldStatus.PENDING)
                                    .createdAt(LocalDateTime.now())
                                    .build();
                        })
                        .toList();

                formFieldRepository.saveAll(fields);
                log.info("Saved {} form fields for form {}",
                        fields.size(), savedForm.getId());
            }

            // 6. Update status
            form.setFormStatus(FormStatus.PENDING_VALIDATION);
            formRepository.save(form);

        } catch (Exception e) {
            log.error("OCR/extraction failed for form {}: {}",
                    savedForm.getId(), e.getMessage());
            // Don't fail the upload — just keep UPLOADED status
        }

        // 7. Publish event
        eventPublisher.publishEvent(new FormSubmittedEvent(
                savedForm.getId(),
                currentUser.getId(),
                savedForm.getFormType().name(),
                savedForm.getScanUrl()
        ));

        return formMapper.toResponse(savedForm);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FormResponse> getMyForms(Pageable pageable) {
        User currentUser = (User) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return formRepository.findByUploadedBy(currentUser, pageable)
                .map(formMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FormResponse> getAllForms(Pageable pageable) {
        return formRepository.findAll(pageable)
                .map(formMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FormResponse getFormById(UUID id) {
        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found: " + id));
        return formMapper.toResponse(form);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormFieldResponse> getFormFields(UUID formId) {
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found: " + formId));
        return formFieldRepository.findByForm(form)
                .stream()
                .map(formMapper::toFieldResponse)
                .toList();
    }

    @Override
    @Transactional
    public FormResponse confirmForm(UUID id) {
        User currentUser = (User) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();

        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found: " + id));

        AiValidation latestValidation = aiValidationRepository.findByFormAndIsLatestTrue(form)
                .orElse(null);
        boolean hasCompletedValidationWithoutSuggestions = latestValidation != null
                && latestValidation.getStatus() == ValidationStatus.COMPLETED
                && fieldSuggestionRepository.findByAiValidation(latestValidation).isEmpty();

        if (form.getFormStatus() != FormStatus.PENDING_CONFIRMATION
                && !hasCompletedValidationWithoutSuggestions) {
            throw new InvalidOperationException(
                    "Form cannot be confirmed in status: " + form.getFormStatus());
        }

        if (!form.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new InvalidOperationException("You can only confirm your own forms");
        }

        form.setFormStatus(FormStatus.CONFIRMED);
        form.setConfirmedAt(LocalDateTime.now());
        form.setConfirmedBy(currentUser);

        return formMapper.toResponse(formRepository.save(form));
    }

    @Override
    @Transactional
    public FormResponse archiveForm(UUID id) {
        User currentUser = (User) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();

        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found: " + id));

        if (form.getFormStatus() == FormStatus.ARCHIVED) {
            throw new InvalidOperationException("Form is already archived");
        }

        if (currentUser.getRole() == UserRole.FIELD_SUPERVISOR
                && !form.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new InvalidOperationException("You can only archive your own forms");
        }

        form.setFormStatus(FormStatus.ARCHIVED);

        return formMapper.toResponse(formRepository.save(form));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormFieldSchemaResponse> getFormSchema(FormType formType) {
        return formFieldSchemaRepository
                .findByFormTypeOrderBySortOrderAsc(formType)
                .stream()
                .map(s -> new FormFieldSchemaResponse(
                        s.getFieldName(),
                        s.getFieldLabel(),
                        s.getFieldType(),
                        s.getIsRequired(),
                        s.getSortOrder()
                ))
                .toList();
    }

    @Transactional
    @Override
    public FormFieldResponse addField(UUID formId, AddFieldRequest request) {
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found: " + formId));

        FormField field = FormField.builder()
                .form(form)
                .fieldName(request.fieldName())
                .extractedValue(request.extractedValue())
                .fieldStatus(FieldStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        FormField saved = formFieldRepository.save(field);
        return formMapper.toFieldResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FormResponse> getFormsWithFilters(
            FormType formType, FormStatus formStatus,
            LocalDateTime from, LocalDateTime to,
            UUID uploadedById, String actName,
            Pageable pageable) {
        return formRepository.findWithFilters(
                        formType != null ? formType.name() : null,
                        formStatus != null ? formStatus.name() : null,
                        from, to, uploadedById, actName, pageable)
                .map(formMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource exportFormsToExcel(FormType formType, FormStatus formStatus,
                                       LocalDateTime from, LocalDateTime to, String actName) {

        User currentUser = getCurrentUser();
        boolean isSupervisor = currentUser.getRole() == UserRole.FIELD_SUPERVISOR;

        List<Form> forms = formRepository.findWithFilters(
                formType != null ? formType.name() : null,
                formStatus != null ? formStatus.name() : null,
                from, to,
                isSupervisor ? currentUser.getId() : null,
                actName,
                Pageable.unpaged()).getContent();

        Map<UUID, List<FormField>> fieldsByForm = new HashMap<>();
        for (Form form : forms) {
            fieldsByForm.put(form.getId(), formFieldRepository.findByForm(form));
        }

        String filePath = excelExportService.generateDetailedFormReport(
                forms, fieldsByForm,
                "Forms Export — " + LocalDate.now());

        return new FileSystemResource(Paths.get(filePath));
    }

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}
