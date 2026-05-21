package com.trackflow.common.audit;

import com.trackflow.module.audit.service.AuditService;
import com.trackflow.module.form.dto.FormResponse;
import com.trackflow.module.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditService auditService;

    // Intercept confirmForm
    @AfterReturning(
            pointcut = "execution(* com.trackflow.module.form.service.FormServiceImpl.confirmForm(..))",
            returning = "result"
    )
    public void auditConfirmForm(Object result) {
        if (result instanceof FormResponse form) {
            auditService.log("FORM", form.id(), "CONFIRMED", null,
                    Map.of("status", "CONFIRMED"));
        }
    }

    // Intercept archiveForm
    @AfterReturning(
            pointcut = "execution(* com.trackflow.module.form.service.FormServiceImpl.archiveForm(..))",
            returning = "result"
    )
    public void auditArchiveForm(Object result) {
        if (result instanceof FormResponse form) {
            auditService.log("FORM", form.id(), "ARCHIVED", null,
                    Map.of("status", "ARCHIVED"));
        }
    }

    // Intercept createUser
    @AfterReturning(
            pointcut = "execution(* com.trackflow.module.user.service.UserServiceImpl.createUser(..))",
            returning = "result"
    )
    public void auditCreateUser(Object result) {
        if (result instanceof UserResponse user) {
            auditService.log("USER", user.id(), "CREATED", null,
                    Map.of("email", user.email(), "role", user.role()));
        }
    }

    // Intercept updateUserRole
    @AfterReturning(
            pointcut = "execution(* com.trackflow.module.user.service.UserServiceImpl.updateUserRole(..))"
    )
    public void auditUpdateRole(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        UUID userId = (UUID) args[0];
        auditService.log("USER", userId, "ROLE_UPDATED", null,
                Map.of("newRole", args[1].toString()));
    }
}
