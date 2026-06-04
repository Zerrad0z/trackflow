package com.trackflow.module.dashboard.dto;

import java.util.Map;

public record DashboardStatsResponse(
        long totalForms,
        long pendingValidation,
        long pendingConfirmation,
        long confirmedToday,
        long confirmedThisWeek,
        long confirmedThisMonth,
        long archivedForms,
        long totalUsers,
        long activeUsers,
        long uploadedToday,
        Map<String, Long> formsByType,
        Map<String, Long> formsByStatus
) {}