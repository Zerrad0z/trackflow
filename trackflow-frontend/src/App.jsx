import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FormsPage from './pages/forms/FormsPage'
import ReportsPage from './pages/reports/ReportsPage'
import UsersPage from './pages/admin/UsersPage'
import FormDetailPage from './pages/forms/FormDetailPage'
import NotificationsPage from './pages/notifications/NotificationsPage'



function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
          <Route path="/forms" element={
  <ProtectedRoute roles={['FIELD_SUPERVISOR', 'MANAGER']}>
    <FormsPage />
  </ProtectedRoute>
} />
<Route path="/forms/:id" element={
  <ProtectedRoute roles={['FIELD_SUPERVISOR', 'MANAGER']}>
    <FormDetailPage />
  </ProtectedRoute>
} />
<Route path="/notifications" element={
  <ProtectedRoute>
    <NotificationsPage />
  </ProtectedRoute>
} />
          <Route path="/users" element={
  <ProtectedRoute roles={['ADMIN']}>
    <UsersPage />
  </ProtectedRoute>
} />
         <Route path="/reports" element={
  <ProtectedRoute roles={['FIELD_SUPERVISOR', 'MANAGER']}>
    <ReportsPage />
  </ProtectedRoute>
} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App