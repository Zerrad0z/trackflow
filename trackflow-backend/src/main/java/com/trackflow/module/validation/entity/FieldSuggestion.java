package com.trackflow.module.validation.entity;

import com.trackflow.module.form.entity.FormField;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
@Table(name = "field_suggestions")
public class FieldSuggestion {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_field_id")
    private FormField formField;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_validation_id")
    private AiValidation aiValidation;

    private String suggestedValue;

    private Float confidence;

    private String reason;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private SuggestionDecision  decision = SuggestionDecision.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime decidedAt;
}