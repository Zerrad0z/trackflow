-- V18__add_form_confirmed_by_supervisor_notification_type.sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'FORM_CONFIRMED_BY_SUPERVISOR';
