package com.trackflow.module.validation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormField;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroqService {

    private final RestClient groqRestClient;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.model}")
    private String model;

    private String validationRules;

    @PostConstruct
    public void loadRules() {
        try {
            ClassPathResource resource = new ClassPathResource("validation/oncf-rules.md");
            this.validationRules = new String(resource.getInputStream().readAllBytes());
            log.info("ONCF validation rules loaded successfully");
        } catch (IOException e) {
            log.error("Failed to load validation rules: {}", e.getMessage());
            throw new RuntimeException("Cannot load validation rules");
        }
    }

    public String validateFormFields(Form form, List<FormField> fields) {
        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildUserPrompt(form, fields);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.1,
                "max_tokens", 2000
        );

        try {
            String response = groqRestClient
                    .post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            return root.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
            throw new RuntimeException("AI validation failed: " + e.getMessage());
        }
    }

    private String buildSystemPrompt() {
        return "You are an expert ONCF railway form validator.\n\n"
                + "Here are your validation rules:\n"
                + validationRules
                + "\n\nRespond ONLY with a valid JSON array. No markdown, no extra text.\n"
                + "Each object must have exactly: "
                + "fieldName, hasError, suggestedValue, confidence, reason.";
    }

    private String buildUserPrompt(Form form, List<FormField> fields) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Form type: ").append(form.getFormType()).append("\n\n");
        prompt.append("Validate these extracted fields:\n");
        for (FormField field : fields) {
            prompt.append("- ")
                    .append(field.getFieldName())
                    .append(": ")
                    .append(field.getExtractedValue())
                    .append("\n");
        }
        prompt.append("\nReturn ONLY the JSON array.");
        return prompt.toString();
    }
}