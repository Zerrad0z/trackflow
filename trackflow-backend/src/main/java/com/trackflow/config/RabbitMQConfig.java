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