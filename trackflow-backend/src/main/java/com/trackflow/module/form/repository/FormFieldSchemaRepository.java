package com.trackflow.module.form.repository;

import com.trackflow.module.form.entity.FormFieldSchema;
import com.trackflow.module.form.entity.FormType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FormFieldSchemaRepository
        extends JpaRepository<FormFieldSchema, UUID> {
    List<FormFieldSchema> findByFormTypeOrderBySortOrderAsc(FormType formType);
}