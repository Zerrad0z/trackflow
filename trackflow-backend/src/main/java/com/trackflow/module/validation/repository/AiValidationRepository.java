package com.trackflow.module.validation.repository;

import com.trackflow.module.form.entity.Form;
import com.trackflow.module.validation.entity.AiValidation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiValidationRepository extends JpaRepository<AiValidation, UUID> {
    Optional<AiValidation> findByFormAndIsLatestTrue(Form form);
    List<AiValidation> findByFormOrderByRunAtDesc(Form form);
}