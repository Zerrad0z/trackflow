trackflow-backend/
├── src/
│   ├── main/
│   │   ├── java/com/trackflow/
│   │   │   ├── TrackflowApplication.java
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── exception/
│   │   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   │   └── UnauthorizedException.java
│   │   │   │   ├── response/
│   │   │   │   │   ├── ApiResponse.java
│   │   │   │   │   └── PagedResponse.java
│   │   │   │   └── audit/
│   │   │   │       └── AuditListener.java
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── RabbitMQConfig.java
│   │   │   │   └── OpenApiConfig.java
│   │   │   │
│   │   │   ├── module/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── AuthController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   └── AuthService.java
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   └── LoginResponse.java
│   │   │   │   │   └── security/
│   │   │   │   │       ├── JwtUtils.java
│   │   │   │   │       └── JwtAuthFilter.java
│   │   │   │   │
│   │   │   │   ├── user/
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── UserController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   └── UserService.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   └── UserRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   └── User.java
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── UserResponse.java
│   │   │   │   │       ├── CreateUserRequest.java
│   │   │   │   │       └── UpdateRoleRequest.java
│   │   │   │   │
│   │   │   │   ├── form/
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── FormController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── FormService.java
│   │   │   │   │   │   └── OcrService.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── FormRepository.java
│   │   │   │   │   │   └── FormFieldRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   ├── Form.java
│   │   │   │   │   │   └── FormField.java
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── FormResponse.java
│   │   │   │   │   │   └── FormFieldResponse.java
│   │   │   │   │   └── event/
│   │   │   │   │       └── FormSubmittedEvent.java
│   │   │   │   │
│   │   │   │   ├── validation/
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── ValidationController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── ValidationService.java
│   │   │   │   │   │   └── GroqService.java
│   │   │   │   │   ├── consumer/
│   │   │   │   │   │   └── FormValidationConsumer.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── AiValidationRepository.java
│   │   │   │   │   │   └── FieldSuggestionRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   ├── AiValidation.java
│   │   │   │   │   │   └── FieldSuggestion.java
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── ValidationResponse.java
│   │   │   │   │       └── SuggestionDecisionRequest.java
│   │   │   │   │
│   │   │   │   ├── notification/
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── NotificationService.java
│   │   │   │   │   │   └── EmailService.java
│   │   │   │   │   ├── consumer/
│   │   │   │   │   │   └── NotificationConsumer.java
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── NotificationController.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   └── NotificationRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   └── Notification.java
│   │   │   │   │   └── websocket/
│   │   │   │   │       └── NotificationWebSocketHandler.java
│   │   │   │   │
│   │   │   │   ├── report/
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   └── ReportController.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   └── ReportService.java
│   │   │   │   │   ├── consumer/
│   │   │   │   │   │   └── ReportGenerationConsumer.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   └── ReportRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   └── Report.java
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── ReportRequest.java
│   │   │   │   │       └── ReportResponse.java
│   │   │   │   │
│   │   │   │   └── audit/
│   │   │   │       ├── service/
│   │   │   │       │   └── AuditService.java
│   │   │   │       ├── controller/
│   │   │   │       │   └── AuditController.java
│   │   │   │       ├── repository/
│   │   │   │       │   └── AuditLogRepository.java
│   │   │   │       └── entity/
│   │   │   │           └── AuditLog.java
│   │   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │           ├── V1__create_enums.sql
│   │           └── ...
│   └── test/
│       └── java/com/trackflow/
│           └── module/
│               ├── form/
│               ├── validation/
│               └── user/
│
trackflow-frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   └── utils/


module/
├── controller/   → HTTP layer only, no logic
├── service/      → all business logic lives here
├── repository/   → database access only
├── entity/       → JPA entities mapping to DB tables
├── dto/          → what goes in/out of the API
├── consumer/     → RabbitMQ listeners (async)
└── event/        → event objects published to RabbitMQ