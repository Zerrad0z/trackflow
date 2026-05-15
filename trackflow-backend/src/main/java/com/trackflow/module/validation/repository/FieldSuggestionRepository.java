package com.trackflow.module.validation.repository;

import com.trackflow.module.validation.entity.AiValidation;
import com.trackflow.module.validation.entity.FieldSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FieldSuggestionRepository extends JpaRepository<FieldSuggestion, UUID> {
    List<FieldSuggestion> findByAiValidation(AiValidation aiValidation);
}
