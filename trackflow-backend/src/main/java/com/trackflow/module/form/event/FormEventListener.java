package com.trackflow.module.form.event;

import com.trackflow.config.RabbitMQConfig;
import com.trackflow.module.notification.entity.NotificationType;
import com.trackflow.module.notification.service.NotificationService;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.entity.UserRole;
import com.trackflow.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class FormEventListener {

    private final RabbitTemplate rabbitTemplate;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFormSubmitted(FormSubmittedEvent event) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.FORM_EXCHANGE,
                RabbitMQConfig.FORM_SUBMITTED_ROUTING_KEY,
                event);

        // Notify managers of new upload
        userRepository.findByRole(UserRole.MANAGER).forEach(manager -> {
            if (manager.getId().equals(event.uploadedById())) {
                return;
            }
            String uploaderName = userRepository.findById(event.uploadedById())
                    .map(User::getFullName).orElse("Unknown");
            notificationService.sendNotification(manager,
                    String.format("New %s form uploaded by %s.",
                            event.formType(), uploaderName),
                    NotificationType.FORM_UPLOADED,
                    event.formId());
        });
    }
}