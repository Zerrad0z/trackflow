package com.trackflow.module.notification.consumer;

import com.trackflow.config.RabbitMQConfig;
import com.trackflow.module.notification.service.NotificationService;
import com.trackflow.module.user.repository.UserRepository;
import com.trackflow.module.validation.dto.ValidationCompleteEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.VALIDATION_COMPLETE_QUEUE)
    public void handleValidationComplete(ValidationCompleteEvent event) {
        log.info("Received validation.complete event for form: {}", event.formId());

        userRepository.findById(event.uploadedById()).ifPresent(user -> {
            String message = String.format(
                    "Your form %s has been validated. %d suggestion(s) found.",
                    event.formType(),
                    event.suggestionCount()
            );
            notificationService.sendNotification(user, message);
        });
    }
}