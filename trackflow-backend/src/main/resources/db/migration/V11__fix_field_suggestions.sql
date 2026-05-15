-- Drop and recreate field_suggestions with proper structure
DROP TABLE IF EXISTS field_suggestions;

CREATE TABLE field_suggestions (
                                   id                UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
                                   form_field_id     UUID                NOT NULL REFERENCES form_fields(id),
                                   ai_validation_id  UUID                NOT NULL REFERENCES ai_validations(id),
                                   suggested_value   TEXT,
                                   confidence        FLOAT               NOT NULL DEFAULT 0.0,
                                   reason            TEXT,
                                   decision          suggestion_decision NOT NULL DEFAULT 'PENDING',
                                   decided_at        TIMESTAMP
);

CREATE INDEX idx_suggestions_form_field ON field_suggestions(form_field_id);
CREATE INDEX idx_suggestions_validation ON field_suggestions(ai_validation_id);