package com.trackflow.module.form.repository;

import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FormRepository extends JpaRepository<Form, UUID> {
    Page<Form> findByUploadedBy(User uploadedBy, Pageable pageable);
    Page<Form> findByFormStatus(FormStatus formStatus, Pageable pageable);
}
