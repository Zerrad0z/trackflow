-- V6__create_field_suggestions.sql
CREATE TABLE field_suggestions (
    id                UUID                NOT NULL REFERENCES form_fields(id),
    ai_validation_id  UUID                NOT NULL REFERENCES ai_validations(id),
    suggested_value   TEXT,
    confidence        FLOAT               NOT NULL DEFAULT 0.0,
    reason            TEXT,
    decision          suggestion_decision NOT NULL DEFAULT 'PENDING',
    decided_at        TIMESTAMP,
    PRIMARY KEY (id, ai_validation_id)
);