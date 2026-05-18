package com.trackflow.module.validation.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormField;
import com.trackflow.module.form.repository.FormFieldRepository;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.validation.dto.FieldSuggestionResponse;
import com.trackflow.module.validation.dto.ValidationResponse;
import com.trackflow.module.validation.entity.AiValidation;
import com.trackflow.module.validation.entity.FieldSuggestion;
import com.trackflow.module.validation.entity.SuggestionDecision;
import com.trackflow.module.validation.entity.ValidationStatus;
import com.trackflow.module.validation.repository.AiValidationRepository;
import com.trackflow.module.validation.repository.FieldSuggestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ValidationServiceImpl implements ValidationService {

    private final FormRepository formRepository;
    private final FormFieldRepository formFieldRepository;
    private final AiValidationRepository aiValidationRepository;
    private final FieldSuggestionRepository fieldSuggestionRepository;
    private final GroqService groqService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void processFormValidation(UUID formId) {
        // 1. Find form by ID
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));

        // 2. Mark existing validations as SUPERSEDED
        List<AiValidation> existingValidations = aiValidationRepository.findByFormOrderByRunAtDesc(form);
        existingValidations.forEach(v -> {
            v.setIsLatest(false);
            v.setStatus(ValidationStatus.SUPERSEDED);
        });
        aiValidationRepository.saveAll(existingValidations);

        // 3. Create new AiValidation with status PENDING
        AiValidation validation = AiValidation.builder()
                .form(form)
                .status(ValidationStatus.PENDING)
                .isLatest(true)
                .runAt(LocalDateTime.now())
                .build();
        aiValidationRepository.save(validation);

        try {
            // 4. Fetch form fields
            List<FormField> fields = formFieldRepository.findByForm(form);
            if (fields.isEmpty()) {
                log.warn("No fields found for form {}", formId);
            }

            // 5. Call GroqService
            String rawJson = groqService.validateFormFields(form, fields);
            log.debug("Groq raw response for form {}: {}", formId, rawJson);

            // 6. Parse JSON response
            List<Map<String, Object>> suggestions = objectMapper.readValue(
                    rawJson, new TypeReference<>() {}
            );

            // 7. Save FieldSuggestion records
            List<FieldSuggestion> fieldSuggestions = suggestions.stream()
                    .map(raw -> {
                        String fieldName = (String) raw.get("fieldName");

                        FormField matchingField = fields.stream()
                                .filter(f -> f.getFieldName().equals(fieldName))
                                .findFirst()
                                .orElse(null);

                        return FieldSuggestion.builder()
                                .formField(matchingField)
                                .aiValidation(validation)
                                .suggestedValue((String) raw.get("suggestedValue"))
                                .confidence(((Number) raw.get("confidence")).floatValue())
                                .reason((String) raw.get("reason"))
                                .decision(SuggestionDecision.PENDING)
                                .build();
                    })
                    .toList();

            fieldSuggestionRepository.saveAll(fieldSuggestions);

            // 8. Update validation status to COMPLETED
            validation.setStatus(ValidationStatus.COMPLETED);
            aiValidationRepository.save(validation);

            log.info("Validation completed for form {} — {} suggestions saved",
                    formId, fieldSuggestions.size());

        } catch (Exception e) {
            validation.setStatus(ValidationStatus.FAILED);
            aiValidationRepository.save(validation);
            log.error("Validation failed for form {}: {}", formId, e.getMessage());
            throw new RuntimeException("Validation processing failed for form: " + formId, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ValidationResponse getLatestValidation(UUID formId) {
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));

        AiValidation validation = aiValidationRepository.findByFormOrderByRunAtDesc(form)
                .stream()
                .filter(AiValidation::getIsLatest)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No validation found for form: " + formId));

        return toValidationResponse(validation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ValidationResponse> getValidationHistory(UUID formId) {
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));

        return aiValidationRepository.findByFormOrderByRunAtDesc(form)
                .stream()
                .map(this::toValidationResponse)
                .toList();
    }

    // --- Mappers ---

    private ValidationResponse toValidationResponse(AiValidation validation) {
        List<FieldSuggestionResponse> suggestions = fieldSuggestionRepository
                .findByAiValidation(validation)
                .stream()
                .map(s -> new FieldSuggestionResponse(
                        s.getId(),
                        s.getFormField() != null ? s.getFormField().getFieldName() : null,
                        s.getFormField() != null ? s.getFormField().getExtractedValue() : null,
                        s.getSuggestedValue(),
                        s.getConfidence(),
                        s.getReason(),
                        s.getDecision(),
                        s.getDecidedAt()
                ))
                .toList();

        return new ValidationResponse(
                validation.getId(),
                validation.getForm().getId(),
                validation.getStatus(),
                validation.getIsLatest(),
                validation.getRunAt(),
                suggestions
        );
    }

    private FieldSuggestionResponse toFieldSuggestionResponse(FieldSuggestion suggestion) {
        return new FieldSuggestionResponse(
                suggestion.getId(),
                suggestion.getFormField() != null ? suggestion.getFormField().getFieldName() : null,
                suggestion.getFormField() != null ? suggestion.getFormField().getExtractedValue() : null,
                suggestion.getSuggestedValue(),
                suggestion.getConfidence(),
                suggestion.getReason(),
                suggestion.getDecision(),
                suggestion.getDecidedAt()
        );
    }
}