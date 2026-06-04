package com.trackflow.module.report.service;

import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.report.dto.ReportRequest;
import com.trackflow.module.report.dto.ReportResponse;
import com.trackflow.module.report.entity.Report;
import com.trackflow.module.report.repository.ReportRepository;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final FormRepository formRepository;
    private final PdfReportService pdfReportService;
    private final ExcelReportService excelReportService;

    @Override
    @Transactional
    public ReportResponse generateReport(ReportRequest request) {
        User currentUser = getCurrentUser();
        boolean isSupervisor = currentUser.getRole() == UserRole.FIELD_SUPERVISOR;

        // Determine date range
        LocalDateTime from = resolveFromDate(request);
        LocalDateTime to = LocalDateTime.now();

        // Fetch forms — supervisor sees only own, manager sees all
        List<Form> forms = formRepository.findAll().stream()
                .filter(f -> f.getUploadedAt().isAfter(from)
                        && f.getUploadedAt().isBefore(to))
                .filter(f -> !isSupervisor ||
                        f.getUploadedBy().getId().equals(currentUser.getId()))
                .toList();

        String title = "TrackFlow Report — " + request.reportType()
                + (isSupervisor ? " — " + currentUser.getFullName() : "")
                + " (" + from.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + " to " + to.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ")";

        String filePath = request.format().equalsIgnoreCase("PDF")
                ? pdfReportService.generateFormReport(forms, title)
                : excelReportService.generateFormReport(forms, title);

        Report report = Report.builder()
                .generatedBy(currentUser)
                .reportType(request.reportType())
                .fileUrl(filePath)
                .generatedAt(LocalDateTime.now())
                .build();

        Report saved = reportRepository.save(report);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReportResponse> getMyReports(Pageable pageable) {
        User currentUser = getCurrentUser();
        return reportRepository.findByGeneratedBy(currentUser, pageable)
                .map(this::toResponse);
    }

    @Override
    public Resource downloadReport(UUID reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Report not found: " + reportId));

        Path filePath = Paths.get(report.getFileUrl());
        Resource resource = new FileSystemResource(filePath);

        if (!resource.exists()) {
            throw new ResourceNotFoundException("Report file not found");
        }
        return resource;
    }

    private LocalDateTime resolveFromDate(ReportRequest request) {
        return switch (request.reportType()) {
            case DAILY -> LocalDateTime.now().minusDays(1);
            case WEEKLY -> LocalDateTime.now().minusWeeks(1);
            case MONTHLY -> LocalDateTime.now().minusMonths(1);
            case CUSTOM -> request.from() != null
                    ? request.from().atStartOfDay()
                    : LocalDateTime.now().minusMonths(1);
        };
    }

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    private ReportResponse toResponse(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReportType(),
                report.getFileUrl(),
                report.getGeneratedAt(),
                report.getGeneratedBy().getFullName()
        );
    }
}
