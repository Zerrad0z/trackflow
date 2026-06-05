const FORM_NOTIFICATION_TYPES = new Set([
  'FORM_UPLOADED',
  'VALIDATION_COMPLETE',
  'FORM_VALIDATED_BY_MANAGER',
  'FORM_EDITED_BY_MANAGER',
  'FORM_CONFIRMED_BY_SUPERVISOR',
])

export function getNotificationLink(notification) {
  // DEBUG: Log what we're checking
  console.log('getNotificationLink check:', {
    notificationType: notification?.notificationType,
    referenceId: notification?.referenceId,
    hasReferenceId: !!notification?.referenceId,
    isFormType: FORM_NOTIFICATION_TYPES.has(notification?.notificationType),
    availableTypes: [...FORM_NOTIFICATION_TYPES]
  })
  
  if (!notification?.referenceId || !FORM_NOTIFICATION_TYPES.has(notification.notificationType)) {
    return null
  }
  return `/forms/${notification.referenceId}`
}

export function isNotificationClickable(notification) {
  return getNotificationLink(notification) !== null
}