-- V15__add_notification_link_fields.sql
CREATE TYPE notification_type AS ENUM (
    'FORM_UPLOADED',
    'VALIDATION_COMPLETE'
);

ALTER TABLE notifications
    ADD COLUMN notification_type notification_type,
    ADD COLUMN reference_id UUID;
