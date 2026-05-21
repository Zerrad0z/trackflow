package com.trackflow.module.report.service;

import com.trackflow.module.report.dto.ReportRequest;
import com.trackflow.module.report.dto.ReportResponse;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ReportService {
    ReportResponse generateReport(ReportRequest request);
    Page<ReportResponse> getMyReports(Pageable pageable);
    Resource downloadReport(UUID reportId);
}