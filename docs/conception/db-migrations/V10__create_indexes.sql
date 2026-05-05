-- V10__create_indexes.sql
CREATE INDEX idx_forms_uploaded_by   ON forms(uploaded_by);
CREATE INDEX idx_forms_status        ON forms(status);
CREATE INDEX idx_form_fields_form    ON form_fields(form_id);
CREATE INDEX idx_ai_val_form         ON ai_validations(form_id);
CREATE INDEX idx_ai_val_latest       ON ai_validations(form_id, is_latest);
CREATE INDEX idx_notifications_user  ON notifications(user_id, is_read);
CREATE INDEX idx_audit_entity        ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_performer     ON audit_logs(performed_by);