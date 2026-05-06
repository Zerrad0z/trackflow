-- V3__create_forms.sql
CREATE TABLE forms (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by   UUID        NOT NULL REFERENCES users(id),
    form_type     form_type   NOT NULL,
    status        form_status NOT NULL DEFAULT 'UPLOADED',
    scan_url      VARCHAR(500) NOT NULL,
    uploaded_at   TIMESTAMP   NOT NULL DEFAULT now(),
    confirmed_at  TIMESTAMP,
    confirmed_by  UUID        REFERENCES users(id)
);