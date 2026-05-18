package com.trackflow.module.validation.consumer;

import com.trackflow.config.RabbitMQConfig;
import com.trackflow.module.form.event.FormSubmittedEvent;
import com.trackflow.module.validation.service.ValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class FormValidationConsumer {

    private final ValidationService validationService;

    @RabbitListener(queues = RabbitMQConfig.FORM_SUBMITTED_QUEUE)
    public void handleFormSubmitted(FormSubmittedEvent event) {
        log.info("Received form.submitted event for form: {}", event.formId());
        try {
            validationService.processFormValidation(event.formId());
            log.info("Validation completed for form: {}", event.formId());
        } catch (Exception e) {
            log.error("Failed to process validation for form {}: {}",
                    event.formId(), e.getMessage());
        }
    }
}