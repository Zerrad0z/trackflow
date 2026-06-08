import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  if (!user) return <Navigate to="/login" />

  if (user.role === 'ADMIN' && window.location.pathname === '/dashboard') {
    return <Navigate to="/users" replace />
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/users" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}