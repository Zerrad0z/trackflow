package com.trackflow.module.form.repository;

import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.entity.FormType;
import com.trackflow.module.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface FormRepository extends JpaRepository<Form, UUID> {
    Page<Form> findByUploadedBy(User uploadedBy, Pageable pageable);
    Page<Form> findByFormStatus(FormStatus formStatus, Pageable pageable);
    @Query(value = """
    SELECT f.* FROM forms f
    JOIN users u ON u.id = f.uploaded_by
    WHERE (CAST(:formType AS text) IS NULL OR f.form_type::text = :formType)
    AND (CAST(:formStatus AS text) IS NULL OR f.status::text = :formStatus)
    AND (CAST(:from AS timestamp) IS NULL OR f.uploaded_at >= CAST(:from AS timestamp))
    AND (CAST(:to AS timestamp) IS NULL OR f.uploaded_at <= CAST(:to AS timestamp))
    AND (CAST(:uploadedById AS uuid) IS NULL OR f.uploaded_by = CAST(:uploadedById AS uuid))
    AND (CAST(:actName AS text) IS NULL OR LOWER(u.full_name::text) LIKE LOWER(CONCAT('%', :actName, '%')))
    ORDER BY f.uploaded_at DESC
    """,
            countQuery = """
    SELECT COUNT(*) FROM forms f
    JOIN users u ON u.id = f.uploaded_by
    WHERE (CAST(:formType AS text) IS NULL OR f.form_type::text = :formType)
    AND (CAST(:formStatus AS text) IS NULL OR f.status::text = :formStatus)
    AND (CAST(:from AS timestamp) IS NULL OR f.uploaded_at >= CAST(:from AS timestamp))
    AND (CAST(:to AS timestamp) IS NULL OR f.uploaded_at <= CAST(:to AS timestamp))
    AND (CAST(:uploadedById AS uuid) IS NULL OR f.uploaded_by = CAST(:uploadedById AS uuid))
    AND (CAST(:actName AS text) IS NULL OR LOWER(u.full_name::text) LIKE LOWER(CONCAT('%', :actName, '%')))
    """,
            nativeQuery = true)
    Page<Form> findWithFilters(
            @Param("formType") String formType,
            @Param("formStatus") String formStatus,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("uploadedById") UUID uploadedById,
            @Param("actName") String actName,
            Pageable pageable
    );
}
