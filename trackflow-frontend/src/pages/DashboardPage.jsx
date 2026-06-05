import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/common/Layout'
import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/dashboardService'
import { useLanguage } from '../context/LanguageContext'
import {
  FileText, CheckCircle, Clock, Archive,
   AlertCircle, TrendingUp, ArrowRight, Upload
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const today = new Date().toISOString().split('T')[0]

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats().then(r => r.data),
    refetchInterval: 60000
  })

  const statCards = [
    {
      label: t('dashboard.totalForms'),
      value: stats?.totalForms || 0,
      icon: <FileText size={20} />,
      color: '#E8500A',
      bg: '#FFF3ED',
      path: '/forms'
    },
    {
      label: t('dashboard.uploadedToday'),
      value: stats?.uploadedToday || 0,
      icon: <Upload size={20} />,
      color: '#E8500A',
      bg: '#FFF3ED',
      path: `/forms?from=${today}&to=${today}`
    },
    {
      label: t('dashboard.pendingValidation'),
      value: stats?.pendingValidation || 0,
      icon: <Clock size={20} />,
      color: '#F59E0B',
      bg: '#FFFBEB',
      path: '/forms?formStatus=PENDING_VALIDATION'
    },
    {
      label: t('dashboard.pendingConfirmation'),
      value: stats?.pendingConfirmation || 0,
      icon: <AlertCircle size={20} />,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      path: '/forms?formStatus=PENDING_CONFIRMATION'
    },
    {
      label: t('dashboard.confirmedThisMonth'),
      value: stats?.confirmedThisMonth || 0,
      icon: <CheckCircle size={20} />,
      color: '#10B981',
      bg: '#ECFDF5',
      path: '/forms?formStatus=CONFIRMED'
    },
    {
      label: t('dashboard.archivedForms'),
      value: stats?.archivedForms || 0,
      icon: <Archive size={20} />,
      color: '#6B7280',
      bg: '#F9FAFB',
      path: '/forms?formStatus=ARCHIVED'
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('dashboard.welcomeBack', { name: user?.fullName?.split(' ')[0] })} 👋
        </h2>
        <p className="text-gray-500 mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statCards.map(card => (
              <div
                key={card.label}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-xl p-5 border shadow-sm
                           cursor-pointer hover:shadow-md transition-all
                           hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <ArrowRight size={14} className="text-gray-300
                               group-hover:text-orange-400 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Forms by type — clickable bars */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">{t('dashboard.formsByType')}</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(stats?.formsByType || {}).map(([type, count]) => (
                  <div
                    key={type}
                    onClick={() => navigate(`/forms?formType=${type}`)}
                    className="cursor-pointer group"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 group-hover:text-gray-900
                                       transition-colors">
                        {t(`forms.types.${type}`) || type.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{count}</span>
                        <ArrowRight size={12} className="text-gray-300
                                     group-hover:text-orange-400 transition-colors" />
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500
                                   group-hover:opacity-80"
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

            {/* Forms by status — clickable bars */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">{t('dashboard.formsByStatus')}</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(stats?.formsByStatus || {}).map(([status, count]) => (
                  <div
                    key={status}
                    onClick={() => navigate(`/forms?formStatus=${status}`)}
                    className="cursor-pointer group"
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 group-hover:text-gray-900
                                       transition-colors">
                        {t(`forms.statuses.${status}`) || status.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{count}</span>
                        <ArrowRight size={12} className="text-gray-300
                                     group-hover:text-orange-400 transition-colors" />
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500
                                   group-hover:opacity-80"
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

            {/* Confirmation summary — clickable */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">
                  {t('dashboard.confirmationSummary')}
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: t('dashboard.confirmedToday'),
                    value: stats?.confirmedToday,
                    path: `/forms?formStatus=CONFIRMED&from=${today}&to=${today}` },
                  { label: t('dashboard.confirmedThisWeek'),
                    value: stats?.confirmedThisWeek,
                    path: '/forms?formStatus=CONFIRMED' },
                  { label: t('dashboard.confirmedThisMonth'),
                    value: stats?.confirmedThisMonth,
                    path: '/forms?formStatus=CONFIRMED' },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="flex items-center justify-between p-3 bg-gray-50
                               rounded-lg cursor-pointer hover:bg-orange-50
                               transition group"
                  >
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg"
                            style={{ color: '#E8500A' }}>
                        {item.value}
                      </span>
                      <ArrowRight size={12} className="text-gray-300
                                   group-hover:text-orange-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: '#E8500A' }} />
                <h3 className="font-semibold text-gray-800">{t('dashboard.quickActions')}</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: t('dashboard.uploadedToday'),
                    path: `/forms?from=${today}&to=${today}`,
                    desc: t('dashboard.formsToday', { count: stats?.uploadedToday || 0 }) },
                  { label: t('dashboard.pendingValidation'),
                    path: '/forms?formStatus=PENDING_VALIDATION',
                    desc: t('dashboard.formsWaiting', { count: stats?.pendingValidation }) },
                  { label: t('dashboard.pendingConfirmation'),
                    path: '/forms?formStatus=PENDING_CONFIRMATION',
                    desc: t('dashboard.formsWaiting', { count: stats?.pendingConfirmation }) },
                  { label: t('dashboard.generateReport'),
                    path: '/reports',
                    desc: t('dashboard.reportFormats') },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center justify-between p-3
                               rounded-lg border hover:border-orange-300
                               hover:bg-orange-50 transition text-left group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-400
                                 group-hover:text-orange-400 transition-colors" />
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