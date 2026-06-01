import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { formService } from '../../services/formService'
import { Upload, Eye, Archive, CheckCircle, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'


export default function FormsPage() {
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState(null)
  const [formType, setFormType] = useState('RAPPORT_M')
  const queryClient = useQueryClient()
  const navigate = useNavigate()


  // Fetch forms
  const { data, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: () => formService.getForms().then(r => r.data)
  })

  // Upload mutation
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Forms</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-blue-600 text-white 
                     px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Upload Form
        </button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex 
                        items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Form Scan</h3>
              <button onClick={() => setShowUpload(false)}>
                <X size={20} className="text-gray-500" />
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
                  className="w-full border border-gray-300 rounded-lg 
                             px-3 py-2 focus:outline-none focus:ring-2 
                             focus:ring-blue-500"
                >
                  <option value="RAPPORT_M">Rapport M</option>
                  <option value="LETTRE_SOMMATION_BILLET">
                    Lettre Sommation Billet
                  </option>
                  <option value="LETTRE_SOMMATION_CARTE">
                    Lettre Sommation Carte
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scan File (PDF or Image)
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg 
                             p-6 text-center cursor-pointer hover:border-blue-400"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  {file
                    ? <p className="text-sm text-green-600">{file.name}</p>
                    : <p className="text-sm text-gray-500">
                        Click to select file
                      </p>
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
                className="w-full bg-blue-600 text-white py-2 rounded-lg 
                           hover:bg-blue-700 transition disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forms Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading forms...</div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No forms yet. Upload your first form.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium 
                               text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium 
                               text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium 
                               text-gray-500 uppercase">Uploaded By</th>
                <th className="text-left px-6 py-3 text-xs font-medium 
                               text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium 
                               text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forms.map(form => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {form.formType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
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
                    <div className="flex items-center gap-2">
                      <button
  onClick={() => navigate(`/forms/${form.id}`)}
  className="text-blue-600 hover:text-blue-800 p-1"
>
  <Eye size={16} />
</button>
                      {form.formStatus === 'CONFIRMED' && (
                        <button
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                    </div>
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