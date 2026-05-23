import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { notificationService } from '../../services/notificationService'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const { data: unreadData } = useQuery({
  queryKey: ['unread-count'],
  queryFn: () => notificationService.getUnreadCount().then(r => r.data),
  refetchInterval: 30000 // refresh every 30 seconds
})

const unreadCount = unreadData?.count || 0

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['FIELD_SUPERVISOR', 'MANAGER', 'ADMIN'],
      icon: <LayoutDashboard size={20} />
    },
    {
      label: 'Forms',
      path: '/forms',
      roles: ['FIELD_SUPERVISOR', 'MANAGER'],
      icon: <FileText size={20} />
    },
    {
      label: 'Reports',
      path: '/reports',
      roles: ['FIELD_SUPERVISOR', 'MANAGER'],
      icon: <BarChart3 size={20} />
    },
    {
      label: 'Users',
      path: '/users',
      roles: ['ADMIN'],
      icon: <Users size={20} />
    },
    {
  label: 'Notifications',
  path: '/notifications',
  roles: ['FIELD_SUPERVISOR', 'MANAGER', 'ADMIN'],
  icon: <Bell size={20} />
}
  ]

  const visibleItems = navItems.filter(item =>
    item.roles.includes(user?.role)
  )

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'}
                       bg-gray-900 text-white transition-all duration-300
                       flex flex-col`}>

        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && (
            <span className="text-xl font-bold text-white">TrackFlow</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            {sidebarOpen
              ? <ChevronLeft size={20} />
              : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1">
          {visibleItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg
                         transition hover:bg-gray-700
                         ${location.pathname === item.path
                           ? 'bg-blue-600 text-white'
                           : 'text-gray-300'}`}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400
                       hover:text-red-400 transition w-full px-1"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top navbar */}
        <header className="bg-white shadow-sm px-6 py-4 flex
                           items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">
            {visibleItems.find(i => i.path === location.pathname)?.label
              || 'TrackFlow'}
          </h1>
          <div className="flex items-center gap-4">
          <button
  onClick={() => navigate('/notifications')}
  className="relative text-gray-500 hover:text-gray-700"
>
  <Bell size={20} />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white
                     text-xs rounded-full w-4 h-4 flex items-center
                     justify-center">
      {unreadCount}
    </span>
  )}
</button>
            <span className="text-sm text-gray-500">{user?.fullName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}