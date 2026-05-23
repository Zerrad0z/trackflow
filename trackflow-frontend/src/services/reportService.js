import api from './api'

export const reportService = {
  generateReport: (data) => api.post('/reports', data),
  getMyReports: (params) => api.get('/reports', { params }),
  downloadReport: (id) => api.get(`/reports/${id}/download`, {
    responseType: 'blob'
  }),
}