package com.trackflow.module.validation.service;

import com.trackflow.common.exception.InvalidOperationException;
import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormField;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.form.entity.FieldStatus;
import com.trackflow.module.form.repository.FormFieldRepository;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.validation.dto.SuggestionDecisionRequest;
import com.trackflow.module.validation.dto.SuggestionDecisionResponse;
import com.trackflow.module.validation.entity.AiValidation;
import com.trackflow.module.validation.entity.FieldSuggestion;
import com.trackflow.module.validation.entity.SuggestionDecision;
import com.trackflow.module.validation.entity.ValidationStatus;
import com.trackflow.module.validation.repository.AiValidationRepository;
import com.trackflow.module.validation.repository.FieldSuggestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ValidationServiceTest {

    @Mock private FieldSuggestionRepository fieldSuggestionRepository;
    @Mock private FormFieldRepository formFieldRepository;
    @Mock private FormRepository formRepository;
    @Mock private AiValidationRepository aiValidationRepository;
    @Mock private GroqService groqService;

    @InjectMocks private ValidationServiceImpl validationService;

    private FormField formField;
    private FieldSuggestion pendingSuggestion;
    private FieldSuggestion decidedSuggestion;

    @BeforeEach
    void setUp() {
        Form form = Form.builder()
                .id(UUID.randomUUID())
                .formType(FormType.RAPPORT_M)
                .build();

        formField = FormField.builder()
                .id(UUID.randomUUID())
                .form(form)
                .fieldName("station_name")
                .extractedValue("casablanca")
                .fieldStatus(FieldStatus.PENDING)
                .build();

        AiValidation validation = AiValidation.builder()
                .id(UUID.randomUUID())
                .form(form)
                .status(ValidationStatus.COMPLETED)
                .isLatest(true)
                .build();

        pendingSuggestion = FieldSuggestion.builder()
                .id(UUID.randomUUID())
                .formField(formField)
                .aiValidation(validation)
                .suggestedValue("CASABLANCA VOYAGEURS")
                .confidence(0.95f)
                .reason("Station name must be uppercase")
                .decision(SuggestionDecision.PENDING)
                .build();

        decidedSuggestion = FieldSuggestion.builder()
                .id(UUID.randomUUID())
                .formField(formField)
                .aiValidation(validation)
                .suggestedValue("CASABLANCA VOYAGEURS")
                .confidence(0.95f)
                .decision(SuggestionDecision.ACCEPTED)
                .decidedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void decideSuggestion_withAccepted_shouldSetConfirmedValueToSuggested() {
        // Arrange
        when(fieldSuggestionRepository.findById(pendingSuggestion.getId()))
                .thenReturn(Optional.of(pendingSuggestion));
        when(formFieldRepository.save(any())).thenReturn(formField);
        when(fieldSuggestionRepository.save(any())).thenReturn(pendingSuggestion);

        SuggestionDecisionRequest request = new SuggestionDecisionRequest(
                SuggestionDecision.ACCEPTED, null);

        // Act
        SuggestionDecisionResponse response =
                validationService.decideSuggestion(pendingSuggestion.getId(), request);

        // Assert
        assertThat(formField.getConfirmedValue()).isEqualTo("CASABLANCA VOYAGEURS");
        assertThat(pendingSuggestion.getDecision()).isEqualTo(SuggestionDecision.ACCEPTED);
        assertThat(pendingSuggestion.getDecidedAt()).isNotNull();
    }

    @Test
    void decideSuggestion_withRejected_shouldKeepOriginalValue() {
        // Arrange
        when(fieldSuggestionRepository.findById(pendingSuggestion.getId()))
                .thenReturn(Optional.of(pendingSuggestion));
        when(formFieldRepository.save(any())).thenReturn(formField);
        when(fieldSuggestionRepository.save(any())).thenReturn(pendingSuggestion);

        SuggestionDecisionRequest request = new SuggestionDecisionRequest(
                SuggestionDecision.REJECTED, null);

        // Act
        validationService.decideSuggestion(pendingSuggestion.getId(), request);

        // Assert — confirmed value should be the original extracted value
        assertThat(formField.getConfirmedValue()).isEqualTo("casablanca");
        assertThat(pendingSuggestion.getDecision()).isEqualTo(SuggestionDecision.REJECTED);
    }

    @Test
    void decideSuggestion_withOverridden_shouldUseCustomValue() {
        // Arrange
        when(fieldSuggestionRepository.findById(pendingSuggestion.getId()))
                .thenReturn(Optional.of(pendingSuggestion));
        when(formFieldRepository.save(any())).thenReturn(formField);
        when(fieldSuggestionRepository.save(any())).thenReturn(pendingSuggestion);

        SuggestionDecisionRequest request = new SuggestionDecisionRequest(
                SuggestionDecision.OVERRIDDEN, "CASA PORT");

        // Act
        validationService.decideSuggestion(pendingSuggestion.getId(), request);

        // Assert
        assertThat(formField.getConfirmedValue()).isEqualTo("CASA PORT");
        assertThat(pendingSuggestion.getDecision()).isEqualTo(SuggestionDecision.OVERRIDDEN);
    }

    @Test
    void decideSuggestion_withOverridden_andNoValue_shouldThrowException() {
        // Arrange
        when(fieldSuggestionRepository.findById(pendingSuggestion.getId()))
                .thenReturn(Optional.of(pendingSuggestion));

        SuggestionDecisionRequest request = new SuggestionDecisionRequest(
                SuggestionDecision.OVERRIDDEN, null);

        // Act & Assert
        assertThatThrownBy(() ->
                validationService.decideSuggestion(pendingSuggestion.getId(), request))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Override value is required");
    }

    @Test
    void decideSuggestion_alreadyDecided_shouldThrowException() {
        // Arrange
        when(fieldSuggestionRepository.findById(decidedSuggestion.getId()))
                .thenReturn(Optional.of(decidedSuggestion));

        SuggestionDecisionRequest request = new SuggestionDecisionRequest(
                SuggestionDecision.REJECTED, null);

        // Act & Assert
        assertThatThrownBy(() ->
                validationService.decideSuggestion(decidedSuggestion.getId(), request))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Decision already made");
    }

    @Test
    void decideSuggestion_notFound_shouldThrowException() {
        // Arrange
        UUID unknownId = UUID.randomUUID();
        when(fieldSuggestionRepository.findById(unknownId))
                .thenReturn(Optional.empty());

        SuggestionDecisionRequest request = new SuggestionDecisionRequest(
                SuggestionDecision.ACCEPTED, null);

        // Act & Assert
        assertThatThrownBy(() ->
                validationService.decideSuggestion(unknownId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}