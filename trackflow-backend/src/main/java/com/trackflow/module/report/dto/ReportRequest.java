package com.trackflow.module.report.dto;

import com.trackflow.module.report.entity.ReportType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReportRequest(
        @NotNull ReportType reportType,
        LocalDate from,
        LocalDate to,
        @NotNull String format  // "PDF" or "EXCEL"
) {}
