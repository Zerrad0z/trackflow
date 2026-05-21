package com.trackflow.module.validation.entity;

import com.trackflow.module.form.entity.Form;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
@Table(name = "ai_validations")
public class AiValidation {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id")
    private Form form;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private ValidationStatus status;

    @Column(nullable = false)
    private Boolean isLatest = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime runAt = LocalDateTime.now();
}