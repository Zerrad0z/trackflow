package com.trackflow.module.form.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroqExtractionService {

    private final RestClient groqRestClient;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.model}")
    private String model;

    public List<Map<String, String>> extractFields(String rawText, String formType) {
        String prompt = buildExtractionPrompt(rawText, formType);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", """
                            You are an ONCF railway form data extractor.
                            Extract all fields from the raw OCR text and return them as a JSON array.
                            Each object must have exactly two fields: "fieldName" and "value".
                            Use snake_case for field names.
                            Respond ONLY with the JSON array, no markdown, no extra text.
                            """),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.1,
                "max_tokens", 1000
        );

        try {
            String response = groqRestClient
                    .post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            String content = objectMapper.readTree(response)
                    .path("choices").get(0)
                    .path("message").path("content")
                    .asText();

            return objectMapper.readValue(content,
                    new TypeReference<List<Map<String, String>>>() {});

        } catch (Exception e) {
            log.error("Groq extraction failed: {}", e.getMessage());
            return List.of();
        }
    }

    private String buildExtractionPrompt(String rawText, String formType) {
        return "Form type: " + formType + "\n\n" +
                "Raw OCR text:\n" + rawText + "\n\n" +
                "Extract all fields and return JSON array.";
    }
}