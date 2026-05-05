-- V1__create_enums.sql
CREATE TYPE user_role AS ENUM (
    'FIELD_SUPERVISOR',
    'MANAGER',
    'ADMIN'
);

CREATE TYPE form_status AS ENUM (
    'UPLOADED',
    'OCR_PROCESSING',
    'PENDING_VALIDATION',
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'ARCHIVED'
);

CREATE TYPE form_type AS ENUM (
    'LETTRE_SOMMATION_BILLET',
    'LETTRE_SOMMATION_CARTE',
    'RAPPORT_M'
);

CREATE TYPE field_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'OVERRIDDEN',
    'REJECTED'
);

CREATE TYPE suggestion_decision AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'OVERRIDDEN'
);

CREATE TYPE validation_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'SUPERSEDED'
);

CREATE TYPE report_type AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'CUSTOM'
);