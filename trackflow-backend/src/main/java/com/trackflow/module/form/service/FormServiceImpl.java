package com.trackflow.module.form.service;

import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.module.form.dto.FormFieldResponse;
import com.trackflow.module.form.dto.FormMapper;
import com.trackflow.module.form.dto.FormResponse;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.user.dto.UserResponse;
import com.trackflow.module.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FormServiceImpl implements FormService {

    private final FormRepository formRepository;
    private final StorageService storageService;
    private final FormMapper formMapper;

    @Override
    @Transactional
    public FormResponse uploadForm(MultipartFile file, FormType formType) {
        // 1. Get current authenticated user
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        // 2. Store the file
        String filePath = storageService.storeFile(file);

        // 3. Create and save Form entity
        Form form = Form.builder()
                .formType(formType)
                .formStatus(FormStatus.UPLOADED)
                .scanUrl(filePath)
                .uploadedAt(LocalDateTime.now())
                .uploadedBy(currentUser)
                .build();

        Form savedForm = formRepository.save(form);

        // 4. Return FormResponse
        return formMapper.toResponse(savedForm);
    }

    @Override
    public Page<FormResponse> getMyForms(Pageable pageable) {
        return null;
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
    public List<FormFieldResponse> getFormFields(UUID formId) {
        return List.of();
    }

    @Override
    public FormResponse confirmForm(UUID id) {
        return null;
    }

    @Override
    public FormResponse archiveForm(UUID id) {
        return null;
    }
}
