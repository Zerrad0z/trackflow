-- V9__create_audit_logs.sql
CREATE TABLE audit_logs (
    id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    UUID        NOT NULL,
    action       VARCHAR(50) NOT NULL,
    performed_by UUID        REFERENCES users(id),
    old_value    JSONB,
    new_value    JSONB,
    created_at   TIMESTAMP   NOT NULL DEFAULT now()
);