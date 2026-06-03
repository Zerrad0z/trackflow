import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { formService } from '../../services/formService'
import { Upload, Eye, Plus, X, Search, Filter, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function FormsPage() {
  const [showUpload, setShowUpload] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [file, setFile] = useState(null)
  const [formType, setFormType] = useState('RAPPORT_M')
  const [filters, setFilters] = useState({
    formType: '',
    formStatus: '',
    from: '',
    to: '',
    actName: ''
  })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Build active filters for query
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== '')
  )

  const { data, isLoading } = useQuery({
    queryKey: ['forms', activeFilters],
    queryFn: () => formService.getForms(activeFilters).then(r => r.data)
  })

  const uploadMutation = useMutation({
    mutationFn: (formData) => formService.uploadForm(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['forms'])
      setShowUpload(false)
      setFile(null)
      toast.success('Form uploaded! AI validation in progress...')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Upload failed')
    }
  })

  const handleUpload = (e) => {
    e.preventDefault()
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('formType', formType)
    uploadMutation.mutate(formData)
  }

  const clearFilters = () => {
    setFilters({ formType: '', formStatus: '', from: '', to: '', actName: '' })
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  const statusColors = {
    UPLOADED: 'bg-blue-100 text-blue-700',
    OCR_PROCESSING: 'bg-yellow-100 text-yellow-700',
    PENDING_VALIDATION: 'bg-orange-100 text-orange-700',
    PENDING_CONFIRMATION: 'bg-purple-100 text-purple-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  }

  const forms = data?.content || []

  return (
    <Layout>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Forms</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data?.totalElements || 0} total forms
          </p>
        </div>
        {user?.role === 'FIELD_SUPERVISOR' && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-white px-4 py-2
                       rounded-lg transition text-sm font-medium"
            style={{ backgroundColor: '#E8500A' }}
          >
            <Plus size={16} />
            Upload Form
          </button>
        )}
      </div>

      {/* Filter bar — managers only */}
      {user?.role !== 'FIELD_SUPERVISOR' && (
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Filter size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="text-white text-xs rounded-full px-1.5 py-0.5"
                      style={{ backgroundColor: '#E8500A' }}>
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown size={14} className={`transition-transform
                ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select
                value={filters.formType}
                onChange={(e) => setFilters({...filters, formType: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-1"
              >
                <option value="">All Types</option>
                <option value="RAPPORT_M">Rapport M</option>
                <option value="LETTRE_SOMMATION_BILLET">Sommation Billet</option>
                <option value="LETTRE_SOMMATION_CARTE">Sommation Carte</option>
              </select>

              <select
                value={filters.formStatus}
                onChange={(e) => setFilters({...filters, formStatus: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-1"
              >
                <option value="">All Statuses</option>
                <option value="UPLOADED">Uploaded</option>
                <option value="PENDING_VALIDATION">Pending Validation</option>
                <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <input
                type="text"
                placeholder="Search ACT name..."
                value={filters.actName}
                onChange={(e) => setFilters({...filters, actName: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-1"
              />

              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({...filters, from: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-1"
              />

              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({...filters, to: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-1"
              />
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex
                        items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Upload Form Scan</h3>
              <button onClick={() => setShowUpload(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2
                             focus:outline-none focus:ring-1 text-sm"
                >
                  <option value="RAPPORT_M">Rapport M</option>
                  <option value="LETTRE_SOMMATION_BILLET">Lettre Sommation Billet</option>
                  <option value="LETTRE_SOMMATION_CARTE">Lettre Sommation Carte</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scan File
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg
                             p-6 text-center cursor-pointer hover:border-orange-400
                             transition"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  {file
                    ? <p className="text-sm text-green-600 font-medium">{file.name}</p>
                    : <p className="text-sm text-gray-500">Click to select PDF or image</p>
                  }
                </div>
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
              <button
                type="submit"
                disabled={!file || uploadMutation.isPending}
                className="w-full text-white py-2.5 rounded-lg font-medium
                           transition disabled:opacity-50"
                style={{ backgroundColor: '#E8500A' }}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Form'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forms Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading forms...</div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center">
            <Search size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No forms found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Upload your first form'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Type', 'Status', 'Uploaded By', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium
                                         text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {forms.map(form => (
                <tr key={form.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {form.formType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                                     ${statusColors[form.formStatus]}`}>
                      {form.formStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {form.uploadedBy?.fullName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(form.uploadedAt).toLocaleDateString('fr-MA')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/forms/${form.id}`)}
                      className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg
                                 border transition hover:bg-gray-50"
                      style={{ borderColor: '#E8500A', color: '#E8500A' }}
                    >
                      <Eye size={14} />
                      View
                    </button>
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