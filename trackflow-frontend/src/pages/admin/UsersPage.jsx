import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { userService } from '../../services/userService'
import { UserPlus, X } from 'lucide-react'
import toast from 'react-hot-toast'


export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', role: 'FIELD_SUPERVISOR'
  })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers().then(r => r.data)
  })

 const createMutation = useMutation({
  mutationFn: (data) => userService.createUser(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['users'])
    setShowCreate(false)
    setForm({ fullName: '', email: '', password: '', role: 'FIELD_SUPERVISOR' })
    toast.success('User created successfully!')
  },
  onError: (err) => {
    toast.error(err.response?.data?.message || 'Failed to create user')
  }
})

  const roleColors = {
    ADMIN: 'bg-red-100 text-red-700',
    MANAGER: 'bg-purple-100 text-purple-700',
    FIELD_SUPERVISOR: 'bg-blue-100 text-blue-700',
  }

  const users = data?.content || []

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white
                     px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus size={18} />
          New User
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex
                        items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create User</h3>
              <button onClick={() => setShowCreate(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Full Name', key: 'fullName', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Password', key: 'password', type: 'password' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIELD_SUPERVISOR">Field Supervisor</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded-lg
                           hover:bg-blue-700 transition disabled:opacity-50 mt-2"
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Email', 'Role', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs
                                         font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {user.fullName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs
                                     font-medium ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                                     ${user.isActive
                                       ? 'bg-green-100 text-green-700'
                                       : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}