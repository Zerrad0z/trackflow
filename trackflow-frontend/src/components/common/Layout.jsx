import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { notificationService } from '../../services/notificationService'
import {
  LayoutDashboard, FileText, BarChart3,
  Users, LogOut, ChevronLeft, ChevronRight,
  Bell, Train
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'}
                       text-white transition-all duration-300
                       flex flex-col`}
           style={{ backgroundColor: '#1A1A1A' }}>

        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Train size={24} style={{ color: '#E8500A' }} />
              <span className="text-xl font-bold text-white">TrackFlow</span>
            </div>
          )}
          {!sidebarOpen && (
            <Train size={24} style={{ color: '#E8500A' }} className="mx-auto" />
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-3 flex justify-center"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1 mt-2">
          {visibleItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                         transition-all duration-150
                         ${location.pathname === item.path
                           ? 'text-white font-medium'
                           : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              style={location.pathname === item.path
                ? { backgroundColor: '#E8500A' }
                : {}}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
              {sidebarOpen && item.path === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs
                                 rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen && (
            <div className="mb-3 px-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName}
              </p>
              <p className="text-xs mt-0.5"
                 style={{ color: '#E8500A' }}>
                {roleLabels[user?.role] || user?.role}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400
                       hover:text-red-400 transition w-full px-1 py-1 rounded"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3
                           flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full"
                 style={{ backgroundColor: '#E8500A' }} />
            <h1 className="text-lg font-semibold text-gray-800">
              {visibleItems.find(i => i.path === location.pathname)?.label
                || 'TrackFlow'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative text-gray-500 hover:text-gray-700 p-1"
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center
                              text-white text-sm font-bold"
                   style={{ backgroundColor: '#E8500A' }}>
                {user?.fullName?.charAt(0)}
              </div>
              <span className="text-sm text-gray-600">{user?.fullName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}