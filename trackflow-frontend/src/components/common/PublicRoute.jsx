import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  // If user is logged in, redirect to appropriate page
  if (user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/users" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  // If not logged in, show the login page
  return children
}