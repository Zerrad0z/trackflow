package com.trackflow.module.notification.service;

import com.trackflow.common.exception.ResourceNotFoundException;
import com.trackflow.module.notification.dto.NotificationResponse;
import com.trackflow.module.notification.entity.Notification;
import com.trackflow.module.notification.repository.NotificationRepository;
import com.trackflow.module.user.entity.User;
import com.trackflow.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    @Transactional
    public void sendNotification(User user, String message) {
        // 1. Save to DB
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .isRead(false)
                .sentAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        // 2. WebSocket push
        try {
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/notifications",
                    new NotificationResponse(
                            notification.getId(),
                            notification.getMessage(),
                            notification.getIsRead(),
                            notification.getSentAt()
                    )
            );
            log.info("WebSocket notification sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.warn("WebSocket push failed for user {}: {}", user.getEmail(), e.getMessage());
        }

        // 3. Email
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(fromEmail);
            mail.setTo(user.getEmail());
            mail.setSubject("TrackFlow — New Notification");
            mail.setText(message);
            mailSender.send(mail);
            log.info("Email notification sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Email send failed for user {}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        User currentUser = getCurrentUser();
        return notificationRepository.findByUserOrderBySentAtDesc(currentUser, pageable)
                .map(n -> new NotificationResponse(
                        n.getId(), n.getMessage(), n.getIsRead(), n.getSentAt()));
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found: " + notificationId));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        List<Notification> unread = notificationRepository
                .findByUserAndIsReadFalse(currentUser);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countByUserAndIsReadFalse(currentUser);
    }

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}