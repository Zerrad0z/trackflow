package com.trackflow.module.form.service;

import com.trackflow.common.exception.InvalidOperationException;
import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.config.RabbitMQConfig;
import com.trackflow.module.form.dto.FormFieldResponse;
import com.trackflow.module.form.dto.FormMapper;
import com.trackflow.module.form.dto.FormResponse;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.form.event.FormSubmittedEvent;
import com.trackflow.module.form.repository.FormFieldRepository;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
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

    @Override
    @Transactional
    public FormResponse uploadForm(MultipartFile file, FormType formType) {
        User currentUser = (User) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();

        String filePath = storageService.storeFile(file);

        Form form = Form.builder()
                .formType(formType)
                .formStatus(FormStatus.UPLOADED)
                .scanUrl(filePath)
                .uploadedAt(LocalDateTime.now())
                .uploadedBy(currentUser)
                .build();

        Form savedForm = formRepository.save(form);

        FormSubmittedEvent event = new FormSubmittedEvent(
                savedForm.getId(),
                currentUser.getId(),
                savedForm.getFormType().name(),
                savedForm.getScanUrl()
        );

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.FORM_EXCHANGE,
                RabbitMQConfig.FORM_SUBMITTED_ROUTING_KEY,
                event
        );

        log.info("Published form.submitted event for form: {}", savedForm.getId());

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

        if (form.getFormStatus() != FormStatus.PENDING_CONFIRMATION) {
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
}