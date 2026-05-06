-- V5__create_ai_validations.sql
CREATE TABLE ai_validations (
    id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id    UUID              NOT NULL REFERENCES forms(id),
    status     validation_status NOT NULL DEFAULT 'PENDING',
    is_latest  BOOLEAN           NOT NULL DEFAULT true,
    run_at     TIMESTAMP         NOT NULL DEFAULT now()
);