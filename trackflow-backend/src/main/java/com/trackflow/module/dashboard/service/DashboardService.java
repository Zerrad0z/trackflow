package com.trackflow.module.dashboard.service;

import com.trackflow.module.dashboard.dto.DashboardStatsResponse;
import com.trackflow.module.form.entity.Form;
import com.trackflow.module.form.entity.FormStatus;
import com.trackflow.module.form.repository.FormRepository;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import com.trackflow.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FormRepository formRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now()
                .with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now()
                .withDayOfMonth(1).atStartOfDay();

        User currentUser = (User) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        boolean isSupervisor = currentUser.getRole() == UserRole.FIELD_SUPERVISOR;

        List<Form> allForms = isSupervisor
                ? formRepository.findByUploadedBy(currentUser)
                : formRepository.findAll();

        long totalForms = allForms.size();
        long uploadedToday = allForms.stream()
                .filter(f -> f.getUploadedAt().isAfter(startOfDay))
                .count();
        long pendingValidation = allForms.stream()
                .filter(f -> f.getFormStatus() == FormStatus.PENDING_VALIDATION)
                .count();
        long pendingConfirmation = allForms.stream()
                .filter(f -> f.getFormStatus() == FormStatus.PENDING_CONFIRMATION)
                .count();
        long confirmedToday = allForms.stream()
                .filter(f -> f.getFormStatus() == FormStatus.CONFIRMED
                        && f.getConfirmedAt() != null
                        && f.getConfirmedAt().isAfter(startOfDay))
                .count();
        long confirmedThisWeek = allForms.stream()
                .filter(f -> f.getFormStatus() == FormStatus.CONFIRMED
                        && f.getConfirmedAt() != null
                        && f.getConfirmedAt().isAfter(startOfWeek))
                .count();
        long confirmedThisMonth = allForms.stream()
                .filter(f -> f.getFormStatus() == FormStatus.CONFIRMED
                        && f.getConfirmedAt() != null
                        && f.getConfirmedAt().isAfter(startOfMonth))
                .count();
        long archivedForms = allForms.stream()
                .filter(f -> f.getFormStatus() == FormStatus.ARCHIVED)
                .count();

        Map<String, Long> formsByType = allForms.stream()
                .collect(Collectors.groupingBy(
                        f -> f.getFormType().name(),
                        Collectors.counting()));

        Map<String, Long> formsByStatus = allForms.stream()
                .collect(Collectors.groupingBy(
                        f -> f.getFormStatus().name(),
                        Collectors.counting()));

        return new DashboardStatsResponse(
                totalForms, pendingValidation, pendingConfirmation,
                confirmedToday, confirmedThisWeek, confirmedThisMonth,
                archivedForms, 0L, 0L, uploadedToday,
                formsByType, formsByStatus
        );
    }
}