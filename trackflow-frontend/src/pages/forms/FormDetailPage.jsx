import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { formService } from '../../services/formService'
import { CheckCircle, XCircle, Edit3, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import api from '../../services/api'

export default function FormDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [overrideValues, setOverrideValues] = useState({})

  const { data: form } = useQuery({
    queryKey: ['form', id],
    queryFn: () => formService.getFormById(id).then(r => r.data)
  })

  const { data: validation, isLoading: validationLoading } = useQuery({
    queryKey: ['validation', id],
    queryFn: () => formService.getLatestValidation(id).then(r => r.data),
    retry: false
  })

  const decideMutation = useMutation({
    mutationFn: ({ suggestionId, decision, overrideValue }) =>
      api.patch(`/suggestions/${suggestionId}/decide`, { decision, overrideValue }),
    onSuccess: () => {
      queryClient.invalidateQueries(['validation', id])
    }
  })

  const decisionColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    OVERRIDDEN: 'bg-purple-100 text-purple-700',
  }

  return (
    <Layout>
      {/* Back button */}
      <button
        onClick={() => navigate('/forms')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={18} />
        Back to Forms
      </button>

      {/* Form Info */}
      {form && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Type</p>
              <p className="font-medium mt-1">{form.formType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Status</p>
              <p className="font-medium mt-1">{form.formStatus}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Uploaded By</p>
              <p className="font-medium mt-1">{form.uploadedBy?.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Date</p>
              <p className="font-medium mt-1">
                {new Date(form.uploadedAt).toLocaleDateString('fr-MA')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Validation Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">AI Validation Results</h3>

        {validationLoading ? (
          <p className="text-gray-500">Loading validation...</p>
        ) : !validation ? (
          <p className="text-gray-500">No validation found for this form.</p>
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
              <div className="space-y-4">
                {validation.suggestions.map(suggestion => (
                  <div key={suggestion.id}
                       className="border rounded-lg p-4">
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
                          <p className="text-sm text-blue-600 mt-1">
                            Suggested: <span className="font-mono bg-blue-50 px-1 rounded">
                              {suggestion.suggestedValue}
                            </span>
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {suggestion.reason}
                        </p>
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
                          <CheckCircle size={14} />
                          Accept
                        </button>
                        <button
                          onClick={() => decideMutation.mutate({
                            suggestionId: suggestion.id,
                            decision: 'REJECTED'
                          })}
                          className="flex items-center gap-1 px-3 py-1 bg-red-50
                                     text-red-700 rounded hover:bg-red-100 text-sm"
                        >
                          <XCircle size={14} />
                          Reject
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
                                       text-sm flex-1 focus:outline-none
                                       focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => decideMutation.mutate({
                              suggestionId: suggestion.id,
                              decision: 'OVERRIDDEN',
                              overrideValue: overrideValues[suggestion.id]
                            })}
                            disabled={!overrideValues[suggestion.id]}
                            className="flex items-center gap-1 px-3 py-1 bg-purple-50
                                       text-purple-700 rounded hover:bg-purple-100
                                       text-sm disabled:opacity-50"
                          >
                            <Edit3 size={14} />
                            Override
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
    </Layout>
  )
}