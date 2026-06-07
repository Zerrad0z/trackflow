package com.trackflow.module.notification.service;

import com.trackflow.module.notification.dto.NotificationResponse;
import com.trackflow.module.notification.entity.NotificationType;
import com.trackflow.module.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {
    void sendNotification(User user, String message, NotificationType type, UUID referenceId);
    void sendNotificationToManagers(String message, NotificationType type, UUID referenceId);
    Page<NotificationResponse> getMyNotifications(Pageable pageable);
    void markAsRead(UUID notificationId);
    void markAllAsRead();
    long getUnreadCount();
}