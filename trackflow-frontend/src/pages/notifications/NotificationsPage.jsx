import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { notificationService } from '../../services/notificationService'
import { getNotificationLink, isNotificationClickable } from '../../utils/notificationLinks'
import { useLanguage } from '../../context/LanguageContext'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getMyNotifications().then(r => r.data)
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['unread-count'])
    }
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['unread-count'])
    }
  })

  const handleNotificationClick = (notification) => {
    const link = getNotificationLink(notification)
    if (!link) return

    if (!notification.isRead) {
      markReadMutation.mutate(notification.id)
    }
    navigate(link)
  }

  const notifications = data?.content || []
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-800">{t('notifications.title')}</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {unreadCount} {t('notifications.unread')}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isLoading}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <CheckCheck size={16} />
              {t('notifications.markAllAsRead')}
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-pulse">{t('notifications.loading')}</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={40} className="mx-auto text-gray-300 mb-2" />
              <p>{t('notifications.noNotifications')}</p>
            </div>
          ) : (
            notifications.map(n => {
              const clickable = isNotificationClickable(n)

              return (
                <div
                  key={n.id}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={() => clickable && handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleNotificationClick(n)
                    }
                  }}
                  className={`flex items-start justify-between p-4 transition ${
                    !n.isRead ? 'bg-blue-50' : ''
                  } ${clickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !n.isRead ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">
                          {new Date(n.sentAt).toLocaleString('fr-MA')}
                        </p>
                        {clickable && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                            <ExternalLink size={12} />
                            {t('notifications.viewForm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markReadMutation.mutate(n.id)
                      }}
                      disabled={markReadMutation.isLoading}
                      className="text-blue-600 hover:text-blue-800 ml-4 flex-shrink-0 disabled:opacity-50"
                      title={t('notifications.markAsRead')}
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </Layout>
  )
}