import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { notificationService } from '../../services/notificationService'
import {
  LayoutDashboard, FileText, BarChart3,
  Users, LogOut, ChevronLeft, ChevronRight,
  Bell, Train, Menu
} from 'lucide-react'

const ONCF_ORANGE = '#E8500A'
const ONCF_BLACK = '#1A1A1A'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationService.getUnreadCount().then(r => r.data),
    refetchInterval: 30000
  })

  const unreadCount = unreadData?.count || 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['FIELD_SUPERVISOR', 'MANAGER'],
      icon: LayoutDashboard
    },
    {
      label: 'Forms',
      path: '/forms',
      roles: ['FIELD_SUPERVISOR', 'MANAGER'],
      icon: FileText
    },
    {
      label: 'Reports',
      path: '/reports',
      roles: ['FIELD_SUPERVISOR', 'MANAGER'],
      icon: BarChart3
    },
    {
      label: 'Users',
      path: '/users',
      roles: ['ADMIN'],
      icon: Users
    },
    {
      label: 'Notifications',
      path: '/notifications',
      roles: ['FIELD_SUPERVISOR', 'MANAGER', 'ADMIN'],
      icon: Bell
    },
  ]

  const visibleItems = navItems.filter(item =>
    item.roles.includes(user?.role)
  )

  const roleLabels = {
    FIELD_SUPERVISOR: 'Field Supervisor',
    MANAGER: 'Manager',
    ADMIN: 'Administrator'
  }

  const currentPage = visibleItems.find(i => i.path === location.pathname)
  const showSidebarText = sidebarOpen || mobileNavOpen

  return (
    <div className="flex h-screen bg-[#F4F5F7] text-gray-950">
      {mobileNavOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`${sidebarOpen ? 'md:w-72' : 'md:w-20'} ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col overflow-hidden text-white transition-all duration-300 md:relative`}
        style={{ backgroundColor: ONCF_BLACK }}
      >
        <div className="absolute inset-x-0 top-0 h-28 opacity-30"
             style={{
               background: 'linear-gradient(135deg, rgba(232,80,10,0.55), transparent 65%)'
             }}
        />
        <div className="relative flex h-20 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#E8500A] ring-1 ring-white/10">
              <Train size={24} />
            </div>
            {showSidebarText && (
              <div className="min-w-0">
                <p className="text-lg font-bold tracking-tight text-white">TrackFlow</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-200">
                  ONCF
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white md:inline-flex"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mx-auto mt-3 hidden h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/10 hover:text-white md:inline-flex"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <nav className="relative flex-1 space-y-1 px-3 py-5">
          {visibleItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileNavOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-gray-950 shadow-lg shadow-black/20'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}
                  style={isActive ? { backgroundColor: ONCF_ORANGE } : {}}
                >
                  <Icon size={19} />
                </span>
                {showSidebarText && <span className="truncate">{item.label}</span>}
                {showSidebarText && item.path === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          {showSidebarText && (
            <div className="mb-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                     style={{ backgroundColor: ONCF_ORANGE }}>
                  {user?.fullName?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
                  <p className="truncate text-xs text-orange-200">
                    {roleLabels[user?.role] || user?.role}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            {showSidebarText && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-950 md:hidden"
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <div className="hidden h-10 w-1 rounded-full md:block"
                 style={{ backgroundColor: ONCF_ORANGE }}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                TrackFlow
              </p>
              <h1 className="truncate text-xl font-semibold tracking-tight text-gray-950">
                {currentPage?.label || 'TrackFlow'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#E8500A]"
              aria-label="Open notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="hidden items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                   style={{ backgroundColor: ONCF_ORANGE }}>
                {user?.fullName?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="max-w-36 truncate text-sm font-semibold text-gray-950">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500">{roleLabels[user?.role] || user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#F4F5F7] p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
