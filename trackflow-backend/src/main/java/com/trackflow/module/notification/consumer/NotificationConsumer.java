package com.trackflow.module.notification.consumer;

import com.trackflow.config.RabbitMQConfig;
import com.trackflow.module.notification.entity.NotificationType;
import com.trackflow.module.notification.service.NotificationService;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import com.trackflow.module.user.repository.UserRepository;
import com.trackflow.module.validation.dto.ValidationCompleteEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.VALIDATION_COMPLETE_QUEUE)
    public void handleValidationComplete(ValidationCompleteEvent event) {
        log.info("Received validation.complete for form: {}", event.formId());

        UUID triggeredById = event.triggeredByUserId();
        User triggeredBy = triggeredById != null
                ? userRepository.findById(triggeredById).orElse(null)
                : null;

        if (triggeredBy != null
                && triggeredBy.getRole() == UserRole.MANAGER
                && !triggeredById.equals(event.uploadedById())) {
            userRepository.findById(event.uploadedById()).ifPresent(supervisor -> {
                String message = String.format(
                        "Your %s form has been validated by %s. %d suggestion(s) found.",
                        event.formType(), triggeredBy.getFullName(), event.suggestionCount());
                notificationService.sendNotification(supervisor, message,
                        NotificationType.FORM_VALIDATED_BY_MANAGER, event.formId());
            });
            return;
        }

        if (triggeredById != null) {
            return;
        }

        String uploaderName = userRepository.findById(event.uploadedById())
                .map(User::getFullName).orElse("Unknown");

        userRepository.findByRole(UserRole.MANAGER).forEach(manager -> {
            if (manager.getId().equals(event.uploadedById())) {
                return;
            }
            String message = String.format(
                    "Form %s uploaded by %s has been validated. %d suggestion(s) found.",
                    event.formType(), uploaderName, event.suggestionCount());
            notificationService.sendNotification(manager, message,
                    NotificationType.VALIDATION_COMPLETE, event.formId());
        });
    }
}
