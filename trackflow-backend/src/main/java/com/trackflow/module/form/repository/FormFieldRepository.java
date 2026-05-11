package com.trackflow.module.form.repository;

import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FormFieldRepository extends JpaRepository<FormField, UUID> {
    List<FormField> findByForm(Form form);
}
