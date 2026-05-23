import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { notificationService } from '../../services/notificationService'
import { Bell, Check, CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const queryClient = useQueryClient()

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

  const notifications = data?.content || []
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full 
                             px-2 py-0.5">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="flex items-center gap-2 text-sm text-blue-600 
                       hover:text-blue-800"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell size={40} className="mx-auto text-gray-300 mb-2" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-start justify-between p-4 
                         ${!n.isRead ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0
                                 ${!n.isRead ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.sentAt).toLocaleString('fr-MA')}
                  </p>
                </div>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markReadMutation.mutate(n.id)}
                  className="text-blue-600 hover:text-blue-800 ml-4 flex-shrink-0"
                  title="Mark as read"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  )
}