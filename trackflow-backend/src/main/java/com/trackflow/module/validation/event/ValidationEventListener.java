package com.trackflow.module.validation.event;

import com.trackflow.config.RabbitMQConfig;
import com.trackflow.module.validation.dto.ValidationCompleteEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ValidationEventListener {

    private final RabbitTemplate rabbitTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onValidationComplete(ValidationCompleteEvent event) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.VALIDATION_EXCHANGE,
                RabbitMQConfig.VALIDATION_COMPLETE_ROUTING_KEY,
                event
        );
    }
}