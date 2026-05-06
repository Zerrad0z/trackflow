-- V7__create_reports.sql
CREATE TABLE reports (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_by    UUID        NOT NULL REFERENCES users(id),
    report_type     report_type NOT NULL,
    file_url        VARCHAR(500),
    generated_at    TIMESTAMP   NOT NULL DEFAULT now()
);