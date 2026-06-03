import api from './api'

export const userService = {
  getAllUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  getUserById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateStatus: (id, isActive) => api.patch(`/users/${id}/status`, { isActive }),
  resetPassword: (id, password) => api.patch(`/users/${id}/password`, { password }),
}