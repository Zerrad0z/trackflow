package com.trackflow.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FORM_EXCHANGE = "form.exchange";
    public static final String FORM_SUBMITTED_QUEUE = "form.submitted.queue";
    public static final String FORM_SUBMITTED_ROUTING_KEY = "form.submitted";
    public static final String VALIDATION_EXCHANGE = "validation.exchange";
    public static final String VALIDATION_COMPLETE_QUEUE = "validation.complete.queue";
    public static final String VALIDATION_COMPLETE_ROUTING_KEY = "validation.complete";

    @Bean
    public TopicExchange formExchange() {
        return new TopicExchange(FORM_EXCHANGE);
    }

    @Bean
    public Queue formSubmittedQueue() {
        return QueueBuilder.durable(FORM_SUBMITTED_QUEUE).build();
    }

    @Bean
    public Binding formSubmittedBinding() {
        return BindingBuilder
                .bind(formSubmittedQueue())
                .to(formExchange())
                .with(FORM_SUBMITTED_ROUTING_KEY);
    }

    @Bean
    public TopicExchange validationExchange() {
        return new TopicExchange(VALIDATION_EXCHANGE);
    }

    @Bean
    public Queue validationCompleteQueue() {
        return QueueBuilder.durable(VALIDATION_COMPLETE_QUEUE).build();
    }

    @Bean
    public Binding validationCompleteBinding() {
        return BindingBuilder
                .bind(validationCompleteQueue())
                .to(validationExchange())
                .with(VALIDATION_COMPLETE_ROUTING_KEY);
    }

    @Bean
    public JacksonJsonMessageConverter messageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}