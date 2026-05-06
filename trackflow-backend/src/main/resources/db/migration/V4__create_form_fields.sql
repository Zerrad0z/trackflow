-- V4__create_form_fields.sql
CREATE TABLE form_fields (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id          UUID         NOT NULL REFERENCES forms(id),
    field_name       VARCHAR(100) NOT NULL,
    extracted_value  TEXT,
    confirmed_value  TEXT,
    status           field_status NOT NULL DEFAULT 'PENDING',
    created_at       TIMESTAMP    NOT NULL DEFAULT now()
);