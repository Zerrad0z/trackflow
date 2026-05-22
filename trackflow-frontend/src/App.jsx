import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'


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
              <div>Forms Page</div>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['ADMIN']}>
              <div>Users Page</div>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute roles={['MANAGER', 'FIELD_SUPERVISOR']}>
              <div>Reports Page</div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App