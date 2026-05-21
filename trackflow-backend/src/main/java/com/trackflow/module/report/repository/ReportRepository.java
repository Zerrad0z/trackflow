package com.trackflow.module.report.repository;

import com.trackflow.module.report.entity.Report;
import com.trackflow.module.report.entity.ReportType;
import com.trackflow.module.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    Page<Report> findByGeneratedBy(User generatedBy, Pageable pageable);
    Page<Report> findByReportType(ReportType reportType, Pageable pageable);
}
