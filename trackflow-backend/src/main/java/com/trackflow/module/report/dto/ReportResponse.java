package com.trackflow.module.report.dto;

import com.trackflow.module.report.entity.ReportType;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        ReportType reportType,
        String fileUrl,
        LocalDateTime generatedAt,
        String generatedByName
) {}
