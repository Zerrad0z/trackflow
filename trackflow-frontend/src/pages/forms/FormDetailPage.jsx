import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { formService } from '../../services/formService'
import {
  CheckCircle, XCircle, Edit3, ArrowLeft,
  FileText, ClipboardList, Plus
} from 'lucide-react'
import { useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function FormDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [overrideValues, setOverrideValues] = useState({})
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({ fieldName: '', extractedValue: '' })
  const [activeTab, setActiveTab] = useState('fields')

  const { data: form } = useQuery({
    queryKey: ['form', id],
    queryFn: () => formService.getFormById(id).then(r => r.data)
  })

  const { data: fields } = useQuery({
    queryKey: ['fields', id],
    queryFn: () => formService.getFormFields(id).then(r => r.data)
  })

  const { data: schema } = useQuery({
    queryKey: ['schema', form?.formType],
    queryFn: () => formService.getFormSchema(form?.formType).then(r => r.data),
    enabled: !!form?.formType
  })

  const { data: validation, isLoading: validationLoading } = useQuery({
    queryKey: ['validation', id],
    queryFn: () => formService.getLatestValidation(id).then(r => r.data || null),
    enabled: activeTab === 'validation',
    retry: false
  })

  const decideMutation = useMutation({
    mutationFn: ({ suggestionId, decision, overrideValue }) =>
      api.patch(`/suggestions/${suggestionId}/decide`, { decision, overrideValue }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['validation', id])
      toast.success(`Suggestion ${variables.decision.toLowerCase()}`)
    },
    onError: () => toast.error('Failed to save decision')
  })

  const confirmMutation = useMutation({
  mutationFn: () => formService.confirmForm(id),
  onSuccess: () => {
    queryClient.invalidateQueries(['form', id])
    toast.success('Form confirmed successfully!')
  },
  onError: () => toast.error('Failed to confirm form')
})

  const addFieldMutation = useMutation({
    mutationFn: (data) => api.post(`/forms/${id}/fields`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fields', id])
      setShowAddField(false)
      setNewField({ fieldName: '', extractedValue: '' })
      toast.success('Field added successfully')
    },
    onError: () => toast.error('Failed to add field')
  })

  const decisionColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    OVERRIDDEN: 'bg-purple-100 text-purple-700',
  }

  const fieldStatusColors = {
    PENDING: 'text-yellow-600',
    ACCEPTED: 'text-green-600',
    OVERRIDDEN: 'text-purple-600',
    REJECTED: 'text-red-600',
  }

  // Merge schema with extracted fields
  const mergedFields = schema?.map(schemaField => {
    const extracted = fields?.find(f => f.fieldName === schemaField.fieldName)
    return {
      ...schemaField,
      extractedValue: extracted?.extractedValue || null,
      confirmedValue: extracted?.confirmedValue || null,
      status: extracted?.status || null,
      fieldId: extracted?.id || null,
    }
  }) || []

  // Extra fields not in schema
  const extraFields = fields?.filter(f =>
    !schema?.find(s => s.fieldName === f.fieldName)
  ) || []

  return (
    <Layout>
      {/* Back */}
      <button
        onClick={() => navigate('/forms')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Back to Forms
      </button>

      {/* Form header */}
      {form && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                   style={{ backgroundColor: '#FFF3ED' }}>
                <FileText size={20} style={{ color: '#E8500A' }} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {form.formType.replace(/_/g, ' ')}
                </h2>
                <p className="text-xs text-gray-500">
                  Form ID: {form.id?.substring(0, 8)}...
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium
              ${form.formStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                form.formStatus === 'ARCHIVED' ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-700'}`}>
              {form.formStatus?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Uploaded by</p>
              <p className="font-medium">{form.uploadedBy?.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(form.uploadedAt).toLocaleDateString('fr-MA')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Confirmed by</p>
              <p className="font-medium">
                {form.confirmedBy?.fullName || '—'}
              </p>
            </div>
          </div>
        </div>
      )}
      {user?.role === 'FIELD_SUPERVISOR' && form && (
        <div className="mb-6">
          {form.formStatus === 'PENDING_CONFIRMATION' ? (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="flex items-center gap-2 text-white px-4 py-2
                         rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: '#E8500A' }}
            >
              <CheckCircle size={16} />
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Form'}
            </button>
          ) : form.formStatus === 'CONFIRMED' ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle size={16} />
              Form already confirmed
            </div>
          ) : form.formStatus !== 'ARCHIVED' && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500">
              <CheckCircle size={16} />
              Confirm available after AI validation
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm
                      border w-fit">
        {[
          { id: 'fields', label: 'Form Fields', icon: <ClipboardList size={15} /> },
          { id: 'validation', label: 'AI Validation', icon: <CheckCircle size={15} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm
                       font-medium transition-all
                       ${activeTab === tab.id
                         ? 'text-white'
                         : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === tab.id
              ? { backgroundColor: '#E8500A' }
              : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fields Tab */}
      {activeTab === 'fields' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-800">Extracted Fields</h3>
            <button
              onClick={() => setShowAddField(true)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg
                         text-white transition"
              style={{ backgroundColor: '#E8500A' }}
            >
              <Plus size={14} />
              Add Field
            </button>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Field', 'Extracted Value', 'Confirmed Value', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium
                                         text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mergedFields.map(field => (
                <tr key={field.fieldName} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {field.fieldLabel}
                      </p>
                      <p className="text-xs text-gray-400">{field.fieldName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {field.extractedValue ? (
                      <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {field.extractedValue}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Not extracted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {field.confirmedValue ? (
                      <span className="text-sm font-mono bg-green-50 px-2 py-0.5 rounded text-green-700">
                        {field.confirmedValue}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {field.status ? (
                      <span className={`text-xs font-medium ${fieldStatusColors[field.status]}`}>
                        {field.status}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {extraFields.map(field => (
                <tr key={field.id} className="hover:bg-gray-50 bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {field.fieldName}
                      </p>
                      <p className="text-xs text-blue-400">Extra field</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {field.extractedValue}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {field.confirmedValue || <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${fieldStatusColors[field.status]}`}>
                      {field.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add field modal */}
          {showAddField && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex
                            items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="font-semibold mb-4">Add Missing Field</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Field Name
                    </label>
                    <select
                      value={newField.fieldName}
                      onChange={(e) => setNewField({...newField, fieldName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 focus:outline-none focus:ring-2 text-sm"
                    >
                      <option value="">Select field...</option>
                      {schema?.filter(s =>
                        !fields?.find(f => f.fieldName === s.fieldName)
                      ).map(s => (
                        <option key={s.fieldName} value={s.fieldName}>
                          {s.fieldLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Value
                    </label>
                    <input
                      type="text"
                      value={newField.extractedValue}
                      onChange={(e) => setNewField({...newField, extractedValue: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 focus:outline-none focus:ring-2 text-sm"
                      placeholder="Enter value..."
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowAddField(false)}
                      className="flex-1 border border-gray-300 text-gray-700
                                 py-2 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => addFieldMutation.mutate(newField)}
                      disabled={!newField.fieldName || !newField.extractedValue}
                      className="flex-1 text-white py-2 rounded-lg text-sm
                                 disabled:opacity-50 transition"
                      style={{ backgroundColor: '#E8500A' }}
                    >
                      Add Field
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">AI Validation Results</h3>
          {validationLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : !validation ? (
            <p className="text-gray-500">No validation found.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${validation.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'}`}>
                  {validation.status}
                </span>
                <span className="text-sm text-gray-500">
                  {validation.suggestions?.length || 0} suggestion(s)
                </span>
              </div>

              {validation.suggestions?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                  <p>No errors found — form looks good!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {validation.suggestions.map(suggestion => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {suggestion.fieldName}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Extracted: <span className="font-mono bg-gray-100 px-1 rounded">
                              {suggestion.extractedValue || '—'}
                            </span>
                          </p>
                          {suggestion.suggestedValue && (
                            <p className="text-sm mt-1" style={{ color: '#E8500A' }}>
                              Suggested: <span className="font-mono bg-orange-50 px-1 rounded">
                                {suggestion.suggestedValue}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{suggestion.reason}</p>
                          <p className="text-xs text-gray-400">
                            Confidence: {Math.round(suggestion.confidence * 100)}%
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                                         ${decisionColors[suggestion.decision]}`}>
                          {suggestion.decision}
                        </span>
                      </div>

                      {suggestion.decision === 'PENDING' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <button
                            onClick={() => decideMutation.mutate({
                              suggestionId: suggestion.id,
                              decision: 'ACCEPTED'
                            })}
                            className="flex items-center gap-1 px-3 py-1 bg-green-50
                                       text-green-700 rounded hover:bg-green-100 text-sm"
                          >
                            <CheckCircle size={14} /> Accept
                          </button>
                          <button
                            onClick={() => decideMutation.mutate({
                              suggestionId: suggestion.id,
                              decision: 'REJECTED'
                            })}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50
                                       text-red-700 rounded hover:bg-red-100 text-sm"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              placeholder="Override value..."
                              value={overrideValues[suggestion.id] || ''}
                              onChange={(e) => setOverrideValues({
                                ...overrideValues,
                                [suggestion.id]: e.target.value
                              })}
                              className="border border-gray-300 rounded px-2 py-1
                                         text-sm flex-1 focus:outline-none"
                            />
                            <button
                              onClick={() => decideMutation.mutate({
                                suggestionId: suggestion.id,
                                decision: 'OVERRIDDEN',
                                overrideValue: overrideValues[suggestion.id]
                              })}
                              disabled={!overrideValues[suggestion.id]}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-50
                                         text-purple-700 rounded text-sm disabled:opacity-50"
                            >
                              <Edit3 size={14} /> Override
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Layout>
  )
}
