import { useState, useEffect, useRef  } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { userService } from '../../services/userService'
import { UserPlus, X, MoreVertical, Shield, Power, Key } from 'lucide-react'
import toast from 'react-hot-toast'


export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showActions, setShowActions] = useState(null)
  const [actionsPosition, setActionsPosition] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
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
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user')
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => userService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowRoleModal(null)
      toast.success('Role updated successfully!')
    },
    onError: () => toast.error('Failed to update role')
  })

  const actionsRef = useRef(null)

useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      actionsRef.current &&
      !actionsRef.current.contains(e.target) &&
      !e.target.closest('[data-actions-trigger]')
    ) {
      setShowActions(null)
      setActionsPosition(null)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  const toggleActions = (userId, trigger) => {
    if (showActions === userId) {
      setShowActions(null)
      setActionsPosition(null)
      return
    }

    const rect = trigger.getBoundingClientRect()
    const menuWidth = 180
    const menuHeight = 132
    const gap = 8
    const margin = 12
    const left = Math.min(
      Math.max(rect.right - menuWidth, margin),
      window.innerWidth - menuWidth - margin
    )
    const opensBelow = rect.bottom + gap + menuHeight <= window.innerHeight - margin
    const top = opensBelow
      ? rect.bottom + gap
      : Math.max(rect.top - menuHeight - gap, margin)

    setActionsPosition({ top, left })
    setShowActions(userId)
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => userService.updateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User status updated!')
    },
    onError: () => toast.error('Failed to update status')
  })

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }) => userService.resetPassword(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowPasswordModal(null)
      setNewPassword('')
      toast.success('Password reset successfully!')
    },
    onError: () => toast.error('Failed to reset password')
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
        <div>
          <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} users total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 text-white px-4 py-2
                     rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#E8500A' }}
        >
          <UserPlus size={16} />
          New User
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex
                        items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Create User</h3>
              <button onClick={() => setShowCreate(false)}>
                <X size={20} className="text-gray-400" />
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
                    onChange={(e) => setForm({...form, [field.key]: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:ring-1 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({...form, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2
                             focus:outline-none focus:ring-1 text-sm"
                >
                  <option value="FIELD_SUPERVISOR">Field Supervisor</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="w-full text-white py-2.5 rounded-lg font-medium
                           disabled:opacity-50 mt-2"
                style={{ backgroundColor: '#E8500A' }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex
                        items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Change Role</h3>
              <button onClick={() => setShowRoleModal(null)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Changing role for <strong>{showRoleModal.fullName}</strong>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-1 text-sm mb-4"
            >
              <option value="">Select role...</option>
              <option value="FIELD_SUPERVISOR">Field Supervisor</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={() => roleMutation.mutate({
                id: showRoleModal.id, role: newRole
              })}
              disabled={!newRole || roleMutation.isPending}
              className="w-full text-white py-2 rounded-lg text-sm
                         disabled:opacity-50"
              style={{ backgroundColor: '#E8500A' }}
            >
              Update Role
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex
                        items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Reset Password</h3>
              <button onClick={() => setShowPasswordModal(null)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Reset password for <strong>{showPasswordModal.fullName}</strong>
            </p>
            <input
              type="password"
              placeholder="New password..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-1 text-sm mb-4"
            />
            <button
              onClick={() => passwordMutation.mutate({
                id: showPasswordModal.id, password: newPassword
              })}
              disabled={!newPassword || passwordMutation.isPending}
              className="w-full text-white py-2 rounded-lg text-sm
                         disabled:opacity-50"
              style={{ backgroundColor: '#E8500A' }}
            >
              Reset Password
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading users...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium
                                         text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center
                                      justify-center text-white text-sm font-bold"
                           style={{ backgroundColor: '#E8500A' }}>
                        {user.fullName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {user.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                                     ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                                     ${user.isActive
                                       ? 'bg-green-100 text-green-700'
                                       : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        data-actions-trigger
                        onClick={(e) => toggleActions(user.id, e.currentTarget)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                      >
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showActions && actionsPosition && (() => {
        const user = users.find(u => u.id === showActions)
        if (!user) return null

        return (
          <div
            ref={actionsRef}
            className="fixed bg-white border rounded-xl shadow-xl z-50 w-48 py-1"
            style={{
              top: `${actionsPosition.top}px`,
              left: `${actionsPosition.left}px`,
              minWidth: '180px'
            }}
          >
            <button
              onClick={() => {
                setShowRoleModal({ id: user.id, fullName: user.fullName })
                setShowActions(null)
                setActionsPosition(null)
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <Shield size={14} /> Change Role
            </button>
            <button
              onClick={() => {
                statusMutation.mutate({ id: user.id, isActive: !user.isActive })
                setShowActions(null)
                setActionsPosition(null)
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <Power size={14} />
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => {
                setShowPasswordModal({ id: user.id, fullName: user.fullName })
                setShowActions(null)
                setActionsPosition(null)
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <Key size={14} /> Reset Password
            </button>
          </div>
        )
      })()}
    </Layout>
  )
}
