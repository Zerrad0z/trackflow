// src/pages/DashboardPage.jsx
import Layout from '../components/common/Layout'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Welcome back</h3>
          <p className="text-2xl font-bold mt-1">{user?.fullName}</p>
          <p className="text-blue-600 text-sm mt-1">{user?.role}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Role</h3>
          <p className="text-2xl font-bold mt-1">{user?.role}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Status</h3>
          <p className="text-2xl font-bold mt-1 text-green-600">Active</p>
        </div>
      </div>
    </Layout>
  )
}