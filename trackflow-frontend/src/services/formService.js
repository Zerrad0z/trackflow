import api from './api'

export const formService = {
  uploadForm: (formData) => api.post('/forms', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getForms: (params) => api.get('/forms', { params }),
  getFormById: (id) => api.get(`/forms/${id}`),
  getFormFields: (id) => api.get(`/forms/${id}/fields`),
  confirmForm: (id) => api.patch(`/forms/${id}/confirm`),
  archiveForm: (id) => api.patch(`/forms/${id}/archive`),
  getLatestValidation: (id) => api.get(`/forms/${id}/validations/latest`),
  getValidationHistory: (id) => api.get(`/forms/${id}/validations`),
}