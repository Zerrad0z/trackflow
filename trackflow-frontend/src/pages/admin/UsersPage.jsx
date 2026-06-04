import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { userService } from '../../services/userService'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import {
  UserPlus, X, MoreVertical, Shield, Power, Key,
  Search, Filter, Users, UserCheck, UserX, Mail,
  BadgeCheck, Crown, BriefcaseBusiness
} from 'lucide-react'
import toast from 'react-hot-toast'

const ONCF_ORANGE = '#E8500A'
const ONCF_BLACK = '#1A1A1A'

const roleLabels = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  FIELD_SUPERVISOR: 'Field Supervisor',
}

const roleStyles = {
  ADMIN: 'bg-[#1A1A1A] text-white ring-1 ring-black/10',
  MANAGER: 'bg-[#FFF0E8] text-[#C43D00] ring-1 ring-[#FFD2BD]',
  FIELD_SUPERVISOR: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
}

const roleIcons = {
  ADMIN: Crown,
  MANAGER: BriefcaseBusiness,
  FIELD_SUPERVISOR: Shield,
}

export default function UsersPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showStatusConfirm, setShowStatusConfirm] = useState(null)
  const [showActions, setShowActions] = useState(null)
  const [actionsPosition, setActionsPosition] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [form, setForm] = useState({
    fullName: '', email: '', role: 'FIELD_SUPERVISOR'
  })
  const actionsRef = useRef(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers().then(r => r.data)
  })

  const users = data?.content || []

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return users.filter(user => {
      const matchesSearch = !term ||
        user.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term)
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? user.isActive : !user.isActive)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const stats = useMemo(() => {
    const active = users.filter(user => user.isActive).length
    const admins = users.filter(user => user.role === 'ADMIN').length

    return {
      total: users.length,
      active,
      inactive: users.length - active,
      admins,
    }
  }, [users])

  const createMutation = useMutation({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowCreate(false)
      setForm({ fullName: '', email: '', role: 'FIELD_SUPERVISOR' })
      toast.success('User created successfully!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user')
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => userService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setShowRoleModal(null)
      setNewRole('')
      toast.success('Role updated successfully!')
    },
    onError: () => toast.error('Failed to update role')
  })

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

  const closeActions = () => {
    setShowActions(null)
    setActionsPosition(null)
  }

  const toggleActions = (userId, trigger) => {
    if (showActions === userId) {
      closeActions()
      return
    }

    const rect = trigger.getBoundingClientRect()
    const menuWidth = 208
    const menuHeight = 148
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

  const openRoleModal = (user) => {
    setShowRoleModal({ id: user.id, fullName: user.fullName })
    setNewRole(user.role || '')
    closeActions()
  }

  const StatCard = ({ icon: Icon, label, value, tone }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )

  const UserAvatar = ({ user }) => (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
         style={{ backgroundColor: ONCF_ORANGE }}>
      {user.fullName?.charAt(0) || '?'}
    </div>
  )

  const RoleBadge = ({ role }) => {
    const Icon = roleIcons[role] || Shield

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[role] || roleStyles.FIELD_SUPERVISOR}`}>
        <Icon size={12} />
        {roleLabels[role] || role}
      </span>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="relative p-6 sm:p-7" style={{ backgroundColor: ONCF_BLACK }}>
            <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-20 lg:block"
                 style={{
                   backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 18px, #E8500A 18px 20px)'
                 }}
            />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-100">
                  <BadgeCheck size={13} />
                  ONCF Administration
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-white">
                  User Management
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                  Manage field supervisors, managers, and administrators across TrackFlow operations.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:brightness-110 disabled:opacity-60"
                style={{ backgroundColor: ONCF_ORANGE }}
              >
                <UserPlus size={17} />
                New User
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-black/5 bg-gray-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total Users" value={stats.total} tone="bg-gray-100 text-gray-700" />
            <StatCard icon={UserCheck} label="Active" value={stats.active} tone="bg-emerald-50 text-emerald-700" />
            <StatCard icon={UserX} label="Inactive" value={stats.inactive} tone="bg-red-50 text-red-700" />
            <StatCard icon={Crown} label="Admins" value={stats.admins} tone="bg-orange-50 text-[#E8500A]" />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or role"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-[#E8500A] focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm font-medium text-gray-700 outline-none focus:border-[#E8500A] focus:ring-2 focus:ring-orange-100"
                >
                  <option value="ALL">All roles</option>
                  <option value="ADMIN">Administrators</option>
                  <option value="MANAGER">Managers</option>
                  <option value="FIELD_SUPERVISOR">Field supervisors</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm font-medium text-gray-700 outline-none focus:border-[#E8500A] focus:ring-2 focus:ring-orange-100"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active only</option>
                <option value="INACTIVE">Inactive only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="grid gap-3 p-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#E8500A]">
                  <Users size={22} />
                </div>
                <h3 className="text-sm font-semibold text-gray-950">No users found</h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Adjust the search or filters to find the account you need.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      User
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      Role
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="transition hover:bg-orange-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-950">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-gray-400">ID #{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            : 'bg-red-50 text-red-700 ring-red-100'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          data-actions-trigger
                          onClick={(e) => toggleActions(user.id, e.currentTarget)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition hover:border-gray-200 hover:bg-white hover:text-gray-950"
                          aria-label={`Open actions for ${user.fullName}`}
                        >
                          <MoreVertical size={17} />
                        </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {showCreate && (
        <UserModal title="Create User" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            {[
              { label: 'Full Name', key: 'fullName', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
            ].map(field => (
              <Field key={field.key} label={field.label}>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#E8500A] focus:ring-2 focus:ring-orange-100"
                />
              </Field>
            ))}
            <Field label="Role">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#E8500A] focus:ring-2 focus:ring-orange-100"
              >
                <option value="FIELD_SUPERVISOR">Field Supervisor</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <PrimaryButton
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </PrimaryButton>
          </div>
        </UserModal>
      )}

      {showRoleModal && (
        <UserModal title="Change Role" onClose={() => setShowRoleModal(null)} compact>
          <p className="mb-4 text-sm text-gray-500">
            Changing role for <strong className="text-gray-950">{showRoleModal.fullName}</strong>
          </p>
          <Field label="New role">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#E8500A] focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Select role...</option>
              <option value="FIELD_SUPERVISOR">Field Supervisor</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <PrimaryButton
            onClick={() => roleMutation.mutate({ id: showRoleModal.id, role: newRole })}
            disabled={!newRole || roleMutation.isPending}
          >
            Update Role
          </PrimaryButton>
        </UserModal>
      )}

      {showPasswordModal && (
        <UserModal title="Reset Password" onClose={() => setShowPasswordModal(null)} compact>
          <p className="mb-4 text-sm text-gray-500">
            Reset password for <strong className="text-gray-950">{showPasswordModal.fullName}</strong>
          </p>
          <Field label="New password">
            <input
              type="password"
              placeholder="Enter a secure password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#E8500A] focus:ring-2 focus:ring-orange-100"
            />
          </Field>
          <PrimaryButton
            onClick={() => passwordMutation.mutate({ id: showPasswordModal.id, password: newPassword })}
            disabled={!newPassword || passwordMutation.isPending}
          >
            Reset Password
          </PrimaryButton>
        </UserModal>
      )}

      <ConfirmDialog
        isOpen={!!showStatusConfirm}
        title={showStatusConfirm?.isActive ? 'Deactivate User' : 'Activate User'}
        message={showStatusConfirm?.isActive
          ? `Are you sure you want to deactivate ${showStatusConfirm?.fullName}? They will no longer be able to login.`
          : `Activate ${showStatusConfirm?.fullName}'s account?`}
        confirmLabel={showStatusConfirm?.isActive ? 'Deactivate' : 'Activate'}
        danger={showStatusConfirm?.isActive}
        onConfirm={() => {
          statusMutation.mutate({
            id: showStatusConfirm.id,
            isActive: !showStatusConfirm.isActive
          })
          setShowStatusConfirm(null)
        }}
        onCancel={() => setShowStatusConfirm(null)}
      />

      {showActions && actionsPosition && (() => {
        const user = users.find(u => u.id === showActions)
        if (!user) return null

        return (
          <div
            ref={actionsRef}
            className="fixed z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-2xl shadow-black/10"
            style={{
              top: `${actionsPosition.top}px`,
              left: `${actionsPosition.left}px`,
              minWidth: '208px'
            }}
          >
            <ActionButton icon={Shield} onClick={() => openRoleModal(user)}>
              Change Role
            </ActionButton>
            <ActionButton
              icon={Power}
              onClick={() => {
                setShowStatusConfirm(user)
                closeActions()
              }}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </ActionButton>
            <ActionButton
              icon={Key}
              onClick={() => {
                setShowPasswordModal({ id: user.id, fullName: user.fullName })
                closeActions()
              }}
            >
              Reset Password
            </ActionButton>
          </div>
        )
      })()}
    </Layout>
  )
}

function UserModal({ title, children, onClose, compact = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className={`w-full ${compact ? 'max-w-sm' : 'max-w-md'} overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/25`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E8500A]">
              ONCF
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-950">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  )
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: ONCF_ORANGE }}
    >
      {children}
    </button>
  )
}

function ActionButton({ icon: Icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-orange-50 hover:text-[#C43D00]"
    >
      <Icon size={15} />
      {children}
    </button>
  )
}