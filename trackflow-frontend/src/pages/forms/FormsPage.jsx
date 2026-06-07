import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { formService } from '../../services/formService'
import { useLanguage } from '../../context/LanguageContext'
import {
  Upload, Eye, Plus, X, Search, Filter, ChevronDown,
  Download, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const PAGE_SIZE = 10

export default function FormsPage() {
  const { t } = useLanguage()
  const [showUpload, setShowUpload] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [file, setFile] = useState(null)
  const [formType, setFormType] = useState('RAPPORT_M')
  const [page, setPage] = useState(0)
  const [searchParams] = useSearchParams()

  const [filters, setFilters] = useState({
    formType: searchParams.get('formType') || '',
    formStatus: searchParams.get('formStatus') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    actName: ''
  })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Build active filters for query
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) =>
      value !== '' && (user?.role !== 'FIELD_SUPERVISOR' || key !== 'actName')
    )
  )

  const queryParams = {
    ...activeFilters,
    page,
    size: PAGE_SIZE
  }

  const updateFilter = (key, value) => {
    setPage(0)
    setFilters(current => ({ ...current, [key]: value }))
  }

  const handleExport = async () => {
    try {
      toast.loading(t('forms.exporting'))
      const response = await formService.exportForms(activeFilters)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `forms_export_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.dismiss()
      toast.success(t('forms.exportSuccess'))
    } catch {
      toast.dismiss()
      toast.error(t('forms.exportFailed'))
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['forms', queryParams],
    queryFn: () => formService.getForms(queryParams).then(r => r.data)
  })

  const uploadMutation = useMutation({
    mutationFn: (formData) => formService.uploadForm(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setPage(0)
      setShowUpload(false)
      setFile(null)
      toast.success(t('forms.uploadSuccess'))
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('forms.uploadFailed'))
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
    setPage(0)
    setFilters({ formType: '', formStatus: '', from: '', to: '', actName: '' })
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) =>
    value !== '' && (user?.role !== 'FIELD_SUPERVISOR' || key !== 'actName')
  ).length

  const statusColors = {
    UPLOADED: 'bg-blue-100 text-blue-700',
    OCR_PROCESSING: 'bg-yellow-100 text-yellow-700',
    PENDING_VALIDATION: 'bg-orange-100 text-orange-700',
    PENDING_CONFIRMATION: 'bg-purple-100 text-purple-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  }

  const forms = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0
  const firstItem = totalElements === 0 ? 0 : page * PAGE_SIZE + 1
  const lastItem = Math.min((page + 1) * PAGE_SIZE, totalElements)

  return (
    <Layout>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{t('forms.title')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalElements} {t('forms.totalForms')}
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
            {t('forms.uploadForm')}
          </button>
        )}

        {user?.role !== 'FIELD_SUPERVISOR' && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-white px-4 py-2
                       rounded-lg text-sm font-medium transition"
            style={{ backgroundColor: '#1A1A1A' }}
          >
            <Download size={16} />
            {t('common.export')}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Filter size={15} />
            {t('common.filter')}
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
              <X size={12} /> {t('common.clear')}
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select
              value={filters.formType}
              onChange={(e) => updateFilter('formType', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-1"
            >
              <option value="">{t('forms.filters.allTypes')}</option>
              <option value="RAPPORT_M">{t('forms.types.RAPPORT_M')}</option>
              <option value="LETTRE_SOMMATION_BILLET">{t('forms.types.LETTRE_SOMMATION_BILLET')}</option>
              <option value="LETTRE_SOMMATION_CARTE">{t('forms.types.LETTRE_SOMMATION_CARTE')}</option>
            </select>

            <select
              value={filters.formStatus}
              onChange={(e) => updateFilter('formStatus', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-1"
            >
              <option value="">{t('forms.filters.allStatuses')}</option>
              <option value="UPLOADED">{t('forms.statuses.UPLOADED')}</option>
              <option value="PENDING_VALIDATION">{t('forms.statuses.PENDING_VALIDATION')}</option>
              <option value="PENDING_CONFIRMATION">{t('forms.statuses.PENDING_CONFIRMATION')}</option>
              <option value="CONFIRMED">{t('forms.statuses.CONFIRMED')}</option>
              <option value="ARCHIVED">{t('forms.statuses.ARCHIVED')}</option>
            </select>

            {user?.role !== 'FIELD_SUPERVISOR' && (
              <input
                type="text"
                placeholder={t('forms.filters.supervisorName')}
                value={filters.actName}
                onChange={(e) => updateFilter('actName', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-1"
              />
            )}

            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-1"
            />

            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-1"
            />
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex
                        items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">{t('forms.uploadFormScan')}</h3>
              <button onClick={() => setShowUpload(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('forms.formType')}
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2
                             focus:outline-none focus:ring-1 text-sm"
                >
                  <option value="RAPPORT_M">{t('forms.types.RAPPORT_M')}</option>
                  <option value="LETTRE_SOMMATION_BILLET">{t('forms.types.LETTRE_SOMMATION_BILLET')}</option>
                  <option value="LETTRE_SOMMATION_CARTE">{t('forms.types.LETTRE_SOMMATION_CARTE')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('forms.scanFile')}
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition
                             ${uploadMutation.isPending
                               ? 'border-orange-400 bg-orange-50 cursor-wait'
                               : 'border-gray-300 cursor-pointer hover:border-orange-400'}`}
                  onClick={() => !uploadMutation.isPending && document.getElementById('fileInput').click()}
                >
                  {uploadMutation.isPending ? (
                    <div className="flex flex-col items-center gap-3">
                      <span className="relative flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-4 w-4 rounded-full bg-orange-500" />
                      </span>
                      <p className="text-sm font-medium text-orange-700">{t('forms.uploading')}</p>
                      {file && (
                        <p className="text-xs text-orange-600">{file.name}</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                      {file
                        ? <p className="text-sm text-green-600 font-medium">{file.name}</p>
                        : <p className="text-sm text-gray-500">{t('forms.clickToSelect')}</p>
                      }
                    </>
                  )}
                </div>
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  disabled={uploadMutation.isPending}
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
              <button
                type="submit"
                disabled={!file || uploadMutation.isPending}
                className="w-full text-white py-2.5 rounded-lg font-medium
                           transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#E8500A' }}
              >
                {uploadMutation.isPending && (
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                  </span>
                )}
                {uploadMutation.isPending ? t('forms.uploading') : t('forms.uploadForm')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forms Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center">
            <Search size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">{t('forms.noFormsFound')}</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeFilterCount > 0 ? t('forms.tryAdjustingFilters') : t('forms.uploadYourFirstForm')}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[t('common.type'), t('common.status'), t('forms.uploadedBy'), t('common.date'), t('common.actions')].map(h => (
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
                    {t(`forms.types.${form.formType}`) || form.formType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                                     ${statusColors[form.formStatus]}`}>
                      {t(`forms.statuses.${form.formStatus}`) || form.formStatus.replace(/_/g, ' ')}
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
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && totalElements > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {t('forms.showing')} <span className="font-medium text-gray-800">{firstItem}</span>
            {' '}{t('forms.to')} <span className="font-medium text-gray-800">{lastItem}</span>
            {' '}{t('forms.of')} <span className="font-medium text-gray-800">{totalElements}</span> {t('forms.forms')}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(current => Math.max(current - 1, 0))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              {t('common.previous')}
            </button>
            <span className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
              {t('forms.page')} {page + 1} {t('forms.of')} {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={() => setPage(current => current + 1)}
              disabled={page + 1 >= totalPages}
              className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('common.next')}
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}