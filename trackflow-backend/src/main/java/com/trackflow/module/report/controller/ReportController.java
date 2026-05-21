package com.trackflow.module.report.controller;

import com.trackflow.module.report.dto.ReportRequest;
import com.trackflow.module.report.dto.ReportResponse;
import com.trackflow.module.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'FIELD_SUPERVISOR')")
    public ResponseEntity<ReportResponse> generateReport(
            @Valid @RequestBody ReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.generateReport(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'FIELD_SUPERVISOR')")
    public ResponseEntity<Page<ReportResponse>> getMyReports(Pageable pageable) {
        return ResponseEntity.ok(reportService.getMyReports(pageable));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('MANAGER', 'FIELD_SUPERVISOR')")
    public ResponseEntity<Resource> downloadReport(@PathVariable UUID id) {
        Resource resource = reportService.downloadReport(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}