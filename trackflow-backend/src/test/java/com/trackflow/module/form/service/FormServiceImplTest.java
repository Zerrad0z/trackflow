package com.trackflow.module.form.service;

import com.trackflow.common.exception.InvalidOperationException;
import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.module.form.dto.FormMapper;
import com.trackflow.module.form.dto.FormResponse;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.form.repository.FormFieldRepository;
import com.trackflow.module.form.repository.FormFieldSchemaRepository;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.notification.service.NotificationService;
import com.trackflow.module.report.service.ExcelReportService;
import com.trackflow.module.user.dto.UserResponse;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import com.trackflow.module.validation.repository.AiValidationRepository;
import com.trackflow.module.validation.repository.FieldSuggestionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FormServiceTest {

    @Mock private FormRepository formRepository;
    @Mock private FormFieldRepository formFieldRepository;
    @Mock private FormMapper formMapper;
    @Mock private StorageService storageService;
    @Mock private OcrService ocrService;
    @Mock private GroqExtractionService groqExtractionService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private FormFieldSchemaRepository formFieldSchemaRepository;
    @Mock private AiValidationRepository aiValidationRepository;
    @Mock private FieldSuggestionRepository fieldSuggestionRepository;
    @Mock private ExcelReportService excelReportService;
    @Mock private NotificationService notificationService;
    @Mock private RabbitTemplate rabbitTemplate;

    @InjectMocks private FormServiceImpl formService;

    private User supervisor;
    private User otherSupervisor;
    private Form uploadedForm;
    private Form pendingConfirmationForm;
    private FormResponse formResponse;

    @BeforeEach
    void setUp() {
        supervisor = User.builder()
                .id(UUID.randomUUID())
                .fullName("Amine Supervisor")
                .email("amine@trackflow.com")
                .role(UserRole.FIELD_SUPERVISOR)
                .isActive(true)
                .build();

        otherSupervisor = User.builder()
                .id(UUID.randomUUID())
                .fullName("Other Supervisor")
                .email("other@trackflow.com")
                .role(UserRole.FIELD_SUPERVISOR)
                .isActive(true)
                .build();

        uploadedForm = Form.builder()
                .id(UUID.randomUUID())
                .formType(FormType.RAPPORT_M)
                .formStatus(FormStatus.UPLOADED)
                .uploadedBy(supervisor)
                .uploadedAt(LocalDateTime.now())
                .scanUrl("uploads/forms/test.pdf")
                .build();

        pendingConfirmationForm = Form.builder()
                .id(UUID.randomUUID())
                .formType(FormType.RAPPORT_M)
                .formStatus(FormStatus.PENDING_CONFIRMATION)
                .uploadedBy(supervisor)
                .uploadedAt(LocalDateTime.now())
                .scanUrl("uploads/forms/test.pdf")
                .build();

        formResponse = new FormResponse(
                uploadedForm.getId(),
                uploadedForm.getFormType(),
                uploadedForm.getFormStatus(),
                false,           // validatedByManager
                null,            // validatedByManagerBy
                uploadedForm.getScanUrl(),
                uploadedForm.getUploadedAt(),
                null,            // confirmedAt
                null,            // uploadedBy
                null             // confirmedBy
        );
    }

    private void mockSecurityContext(User user) {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getPrincipal()).thenReturn(user);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void getFormById_existingForm_shouldReturnForm() {
        when(formRepository.findById(uploadedForm.getId()))
                .thenReturn(Optional.of(uploadedForm));
        when(formMapper.toResponse(uploadedForm)).thenReturn(formResponse);

        FormResponse response = formService.getFormById(uploadedForm.getId());

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(uploadedForm.getId());
    }

    @Test
    void getFormById_notFound_shouldThrowException() {
        UUID unknownId = UUID.randomUUID();
        when(formRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> formService.getFormById(unknownId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void confirmForm_withPendingConfirmation_shouldConfirm() {
        mockSecurityContext(supervisor);
        when(formRepository.findById(pendingConfirmationForm.getId()))
                .thenReturn(Optional.of(pendingConfirmationForm));
        when(aiValidationRepository.findByFormAndIsLatestTrue(pendingConfirmationForm))
                .thenReturn(Optional.empty());
        when(formRepository.save(any())).thenReturn(pendingConfirmationForm);
        when(formMapper.toResponse(any())).thenReturn(formResponse);

        formService.confirmForm(pendingConfirmationForm.getId());

        assertThat(pendingConfirmationForm.getFormStatus())
                .isEqualTo(FormStatus.CONFIRMED);
        assertThat(pendingConfirmationForm.getConfirmedAt()).isNotNull();
        assertThat(pendingConfirmationForm.getConfirmedBy()).isEqualTo(supervisor);
    }

    @Test
    void confirmForm_withWrongStatus_shouldThrowException() {
        mockSecurityContext(supervisor);
        when(formRepository.findById(uploadedForm.getId()))
                .thenReturn(Optional.of(uploadedForm));
        when(aiValidationRepository.findByFormAndIsLatestTrue(uploadedForm))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> formService.confirmForm(uploadedForm.getId()))
                .isInstanceOf(InvalidOperationException.class);
    }

    @Test
    void confirmForm_byOtherSupervisor_shouldThrowException() {
        mockSecurityContext(otherSupervisor);
        when(formRepository.findById(pendingConfirmationForm.getId()))
                .thenReturn(Optional.of(pendingConfirmationForm));
        when(aiValidationRepository.findByFormAndIsLatestTrue(pendingConfirmationForm))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                formService.confirmForm(pendingConfirmationForm.getId()))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("only confirm your own");
    }

    @Test
    void archiveForm_confirmedForm_shouldArchive() {
        mockSecurityContext(supervisor);
        Form confirmedForm = Form.builder()
                .id(UUID.randomUUID())
                .formType(FormType.RAPPORT_M)
                .formStatus(FormStatus.CONFIRMED)
                .uploadedBy(supervisor)
                .uploadedAt(LocalDateTime.now())
                .validatedByManager(false)
                .build();

        when(formRepository.findById(confirmedForm.getId()))
                .thenReturn(Optional.of(confirmedForm));
        when(formRepository.save(any())).thenReturn(confirmedForm);
        when(formMapper.toResponse(any())).thenReturn(formResponse);

        formService.archiveForm(confirmedForm.getId());

        assertThat(confirmedForm.getFormStatus()).isEqualTo(FormStatus.ARCHIVED);
    }

    @Test
    void archiveForm_alreadyArchived_shouldThrowException() {
        mockSecurityContext(supervisor);
        Form archivedForm = Form.builder()
                .id(UUID.randomUUID())
                .formStatus(FormStatus.ARCHIVED)
                .uploadedBy(supervisor)
                .build();

        when(formRepository.findById(archivedForm.getId()))
                .thenReturn(Optional.of(archivedForm));

        assertThatThrownBy(() -> formService.archiveForm(archivedForm.getId()))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("already archived");
    }

    @Test
    void archiveForm_bySupervisorForOtherForm_shouldThrowException() {
        mockSecurityContext(otherSupervisor);
        Form confirmedForm = Form.builder()
                .id(UUID.randomUUID())
                .formStatus(FormStatus.CONFIRMED)
                .uploadedBy(supervisor)
                .build();

        when(formRepository.findById(confirmedForm.getId()))
                .thenReturn(Optional.of(confirmedForm));

        assertThatThrownBy(() -> formService.archiveForm(confirmedForm.getId()))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("only archive your own");
    }
}