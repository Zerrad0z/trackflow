import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'
import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/dashboardService'
import {
  FileText, CheckCircle, Clock, Archive,
  Users, AlertCircle, TrendingUp, ArrowRight
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats().then(r => r.data),
    refetchInterval: 60000
  })

  const statCards = [
    {
      label: 'Total Forms',
      value: stats?.totalForms || 0,
      icon: <FileText size={20} />,
      color: '#E8500A',
      bg: '#FFF3ED',
      path: '/forms'
    },
    {
      label: 'Pending Validation',
      value: stats?.pendingValidation || 0,
      icon: <Clock size={20} />,
      color: '#F59E0B',
      bg: '#FFFBEB',
      path: '/forms'
    },
    {
      label: 'Pending Confirmation',
      value: stats?.pendingConfirmation || 0,
      icon: <AlertCircle size={20} />,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      path: '/forms'
    },
    {
      label: 'Confirmed This Month',
      value: stats?.confirmedThisMonth || 0,
      icon: <CheckCircle size={20} />,
      color: '#10B981',
      bg: '#ECFDF5',
      path: '/forms'
    },
    {
      label: 'Archived Forms',
      value: stats?.archivedForms || 0,
      icon: <Archive size={20} />,
      color: '#6B7280',
      bg: '#F9FAFB',
      path: '/forms'
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: <Users size={20} />,
      color: '#3B82F6',
      bg: '#EFF6FF',
      path: '/users'
    },
  ]

  const formTypeColors = {
    RAPPORT_M: '#E8500A',
    LETTRE_SOMMATION_BILLET: '#3B82F6',
    LETTRE_SOMMATION_CARTE: '#10B981',
  }

  const statusColors = {
    UPLOADED: '#6B7280',
    PENDING_VALIDATION: '#F59E0B',
    PENDING_CONFIRMATION: '#8B5CF6',
    CONFIRMED: '#10B981',
    ARCHIVED: '#9CA3AF',
  }

  const totalForms = stats?.totalForms || 1

  return (
    <Layout>
      {/* Welcome header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.fullName?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 mt-1">
          Here's what's happening with TrackFlow today.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {statCards.map(card => (
              <div
                key={card.label}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-xl p-5 border shadow-sm
                           cursor-pointer hover:shadow-md transition-all
                           hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <ArrowRight size={14} className="text-gray-300" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Forms by type */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">Forms by Type</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(stats?.formsByType || {}).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / totalForms) * 100}%`,
                          backgroundColor: formTypeColors[type] || '#E8500A'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forms by status */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">Forms by Status</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(stats?.formsByStatus || {}).map(([status, count]) => (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">
                        {status.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(count / totalForms) * 100}%`,
                          backgroundColor: statusColors[status] || '#E8500A'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* This week summary */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">Confirmation Summary</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Confirmed Today', value: stats?.confirmedToday },
                  { label: 'Confirmed This Week', value: stats?.confirmedThisWeek },
                  { label: 'Confirmed This Month', value: stats?.confirmedThisMonth },
                ].map(item => (
                  <div key={item.label}
                       className="flex items-center justify-between p-3
                                  bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="font-bold text-lg"
                          style={{ color: '#E8500A' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'View all forms', path: '/forms',
                    desc: `${stats?.totalForms} total` },
                  { label: 'Pending validation',
                    path: '/forms',
                    desc: `${stats?.pendingValidation} forms waiting` },
                  { label: 'Generate report', path: '/reports',
                    desc: 'PDF or Excel' },
                  { label: 'Notifications', path: '/notifications',
                    desc: 'Check updates' },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center justify-between p-3
                               rounded-lg border hover:border-orange-300
                               hover:bg-orange-50 transition text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}