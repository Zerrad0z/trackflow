package com.trackflow.module.form.event;

import com.trackflow.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class FormEventListener {

    private final RabbitTemplate rabbitTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFormSubmitted(FormSubmittedEvent event) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.FORM_EXCHANGE,
                RabbitMQConfig.FORM_SUBMITTED_ROUTING_KEY,
                event
        );
    }
}