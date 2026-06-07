-- V20__add_form_validated_by_manager_user.sql
ALTER TABLE forms
    ADD COLUMN validated_by_manager_by UUID REFERENCES users(id);
