-- V8__create_notifications.sql
CREATE TABLE notifications (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES users(id),
    message    TEXT      NOT NULL,
    is_read    BOOLEAN   NOT NULL DEFAULT false,
    sent_at    TIMESTAMP NOT NULL DEFAULT now()
);