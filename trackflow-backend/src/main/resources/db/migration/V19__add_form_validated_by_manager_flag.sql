-- V19__add_form_validated_by_manager_flag.sql
ALTER TABLE forms
    ADD COLUMN validated_by_manager BOOLEAN NOT NULL DEFAULT FALSE;
