import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { formService } from '../../services/formService'
import {
  CheckCircle, XCircle, Edit3, ArrowLeft,
  FileText, ClipboardList, Plus, X, Archive
} from 'lucide-react'
import { useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function FormDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [overrideValues, setOverrideValues] = useState({})
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({ fieldName: '', extractedValue: '' })
  const [activeTab, setActiveTab] = useState('fields')
  const [infractionStatus, setInfractionStatus] = useState('')
  const [gareReglement, setGareReglement] = useState('')
  const [montantRegle, setMontantRegle] = useState('')
  const [numPP, setNumPP] = useState('')
  const [infractionSaved, setInfractionSaved] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editValues, setEditValues] = useState({})
  const [editInfraction, setEditInfraction] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showConfirmFormDialog, setShowConfirmFormDialog] = useState(false)
  const [showDecisionConfirm, setShowDecisionConfirm] = useState(null)

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

  const isLettreSommation = form?.formType === 'LETTRE_SOMMATION_BILLET' ||
                            form?.formType === 'LETTRE_SOMMATION_CARTE'
  const isBillet = form?.formType === 'LETTRE_SOMMATION_BILLET'

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

  const archiveMutation = useMutation({
    mutationFn: () => formService.archiveForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['form', id])
      toast.success('Form archived!')
      navigate('/forms')
    },
    onError: () => toast.error('Failed to archive form')
  })

  const infractionMutation = useMutation({
    mutationFn: (data) => api.patch(`/forms/${id}/infraction-status`, data),
    onSuccess: () => {
      setInfractionSaved(true)
      toast.success('Infraction status saved!')
      queryClient.invalidateQueries(['fields', id])
    },
    onError: () => toast.error('Failed to save infraction status')
  })

  const enterEditMode = () => {
    const values = {}
    mergedFields.forEach(f => { values[f.fieldName] = f.extractedValue || '' })
    extraFields.forEach(f => { values[f.fieldName] = f.extractedValue || '' })
    // Seed infraction fields from confirmed values
    const infractionFieldNames = ['statut', 'gare_reglement', 'montant_regle', 'num_pp']
    infractionFieldNames.forEach(name => {
      const field = fields?.find(f => f.fieldName === name)
      values[name] = field?.confirmedValue || field?.extractedValue || ''
    })
    setEditValues(values)
    setEditMode(true)
  }

  const updateFieldsMutation = useMutation({
    mutationFn: (updates) => formService.updateFields(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['fields', id])
      setEditMode(false)
      toast.success('Fields updated successfully!')
    },
    onError: () => toast.error('Failed to update fields')
  })

  const handleSaveFields = () => {
    const updates = Object.entries(editValues)
      .filter(([_, value]) => value !== '')
      .map(([fieldName, value]) => ({ fieldName, value }))
    updateFieldsMutation.mutate(updates)
  }

  const canSaveInfraction = infractionStatus === 'NON_REGULARISEE' ||
    (infractionStatus === 'REGULARISEE' &&
     gareReglement &&
     numPP &&
     (isBillet ? montantRegle : true))

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

  const infractionFieldNames = ['statut', 'gare_reglement', 'montant_regle', 'num_pp']

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
  }).filter(f => !infractionFieldNames.includes(f.fieldName)) || []

  // Extra fields not in schema
  const extraFields = fields?.filter(f =>
    !schema?.find(s => s.fieldName === f.fieldName) &&
    !infractionFieldNames.includes(f.fieldName)
  ) || []

  return (
    <Layout>
      {/* Back button and Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/forms')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Forms
        </button>
        
        {/* Actions */}
        {user?.role === 'FIELD_SUPERVISOR' && form && form.formStatus !== 'ARCHIVED' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                         font-medium border border-gray-300 text-gray-600
                         hover:bg-gray-50 transition"
            >
              <Archive size={16} />
              Archive
            </button>
          </div>
        )}
      </div>

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
        <div className="mb-6 flex items-center gap-3">
          {form.formStatus === 'PENDING_CONFIRMATION' &&
           (!isLettreSommation || infractionSaved) ? (
            <button
              onClick={() => setShowConfirmFormDialog(true)}
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
              {form.formStatus === 'PENDING_CONFIRMATION' && isLettreSommation && !infractionSaved
                ? 'Save infraction status before confirming'
                : 'Confirm available after AI validation'}
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
            <div className="flex items-center gap-2">
              {!editMode &&
               form?.formStatus !== 'ARCHIVED' && (
                <>
                  <button
                    onClick={enterEditMode}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg border transition hover:bg-gray-50"
                    style={{ borderColor: '#E8500A', color: '#E8500A' }}
                  >
                    <Edit3 size={14} />
                    Edit Fields
                  </button>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg text-white transition"
                    style={{ backgroundColor: '#E8500A' }}
                  >
                    <Plus size={14} />
                    Add Field
                  </button>
                </>
              )}
              {editMode && form?.formStatus !== 'ARCHIVED' && (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg border border-gray-300 text-gray-600
                               hover:bg-gray-50 transition"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFields}
                    disabled={updateFieldsMutation.isPending}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg text-white transition disabled:opacity-50"
                    style={{ backgroundColor: '#E8500A' }}
                  >
                    <CheckCircle size={14} />
                    {updateFieldsMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
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
                      <p className="text-sm font-medium text-gray-900">{field.fieldLabel}</p>
                      <p className="text-xs text-gray-400">{field.fieldName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editMode && form?.formStatus !== 'ARCHIVED' ? (
                      <input
                        type="text"
                        value={editValues[field.fieldName] || ''}
                        onChange={(e) => setEditValues({
                          ...editValues,
                          [field.fieldName]: e.target.value
                        })}
                        className="w-full border border-gray-300 rounded px-2 py-1
                                   text-sm focus:outline-none focus:ring-1"
                        style={{ '--tw-ring-color': '#E8500A' }}
                      />
                    ) : (
                      field.extractedValue ? (
                        <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {field.extractedValue}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not extracted</span>
                      )
                    )}
                   </td>
                  <td className="px-4 py-3">
                    {field.confirmedValue ? (
                      <span className="text-sm font-mono bg-green-50 px-2 py-0.5
                                       rounded text-green-700">
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

          {/* Infraction Status Summary — show after confirmation for Lettre Sommation */}
          {isLettreSommation &&
           (form?.formStatus === 'CONFIRMED' || form?.formStatus === 'ARCHIVED') && (
            <div className="border-t mt-2 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#E8500A' }} />
                Statut de l'infraction
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Statut', fieldName: 'statut' },
                  { label: 'Gare de Réglement', fieldName: 'gare_reglement' },
                  { label: 'N° PP', fieldName: 'num_pp' },
                  ...(isBillet ? [{ label: 'Montant Réglé', fieldName: 'montant_regle' }] : [])
                ].map(item => {
                  const value = fields?.find(f => f.fieldName === item.fieldName)?.confirmedValue
                  const currentStatut = editMode
                    ? (editValues['statut'] ?? fields?.find(f => f.fieldName === 'statut')?.confirmedValue)
                    : fields?.find(f => f.fieldName === 'statut')?.confirmedValue
                  // Hide gare/num_pp/montant when NON_REGULARISEE
                  if (item.fieldName !== 'statut' && currentStatut === 'NON_REGULARISEE') return null
                  return (
                    <div key={item.fieldName} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      {editMode && form?.formStatus !== 'ARCHIVED' ? (
                        item.fieldName === 'statut' ? (
                          <select
                            value={editValues[item.fieldName] ?? value ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, [item.fieldName]: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1"
                          >
                            <option value="">Sélectionner...</option>
                            <option value="REGULARISEE">✅ Régularisée</option>
                            <option value="NON_REGULARISEE">❌ Non Régularisée</option>
                          </select>
                        ) : item.fieldName === 'gare_reglement' ? (
                          <select
                            value={editValues[item.fieldName] ?? value ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, [item.fieldName]: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1"
                          >
                            <option value="">Sélectionner une gare...</option>
                            {['KENITRA', 'SALE TABRIQUET', 'RABAT VILLE', 'RABAT AGDAL',
                              'CASABLANCA VOYAGEURS', 'CASA PORT', 'MOHAMMEDIA', 'TEMARA',
                              'SETTAT', 'MEKNES VILLE', 'FES', 'TANGER VILLE', 'MARRAKECH',
                              'OUJDA', 'NADOR'].map(gare => (
                              <option key={gare} value={gare}>{gare}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={item.fieldName === 'montant_regle' ? 'number' : 'text'}
                            value={editValues[item.fieldName] ?? value ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, [item.fieldName]: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1"
                          />
                        )
                      ) : (
                        <p className={`text-sm font-medium ${
                          item.fieldName === 'statut'
                            ? value === 'REGULARISEE'
                              ? 'text-green-600'
                              : 'text-red-600'
                            : 'text-gray-800'
                        }`}>
                          {value || '—'}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
                            onClick={() => setShowDecisionConfirm({
                              suggestionId: suggestion.id,
                              decision: 'ACCEPTED'
                            })}
                            className="flex items-center gap-1 px-3 py-1 bg-green-50
                                       text-green-700 rounded hover:bg-green-100 text-sm"
                          >
                            <CheckCircle size={14} /> Accept
                          </button>
                          <button
                            onClick={() => setShowDecisionConfirm({
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

      {/* Infraction Status Section — only for Lettre Sommation forms on validation tab */}
      {isLettreSommation &&
       activeTab === 'validation' &&
       form?.formStatus !== 'ARCHIVED' &&
       form?.formStatus !== 'CONFIRMED' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Statut de l'infraction</h3>
            {infractionSaved && form?.formStatus !== 'CONFIRMED' && (
              <button
                onClick={() => {
                  setInfractionSaved(false)
                  setInfractionStatus('')
                }}
                className="text-sm flex items-center gap-1"
                style={{ color: '#E8500A' }}
              >
                <Edit3 size={14} /> Modify
              </button>
            )}
          </div>

          {infractionSaved ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Statut</p>
                <p className={`text-sm font-medium ${
                  infractionStatus === 'REGULARISEE' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {infractionStatus === 'REGULARISEE' ? '✅ Régularisée' : '❌ Non Régularisée'}
                </p>
              </div>
              {infractionStatus === 'REGULARISEE' && (
                <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Gare de Réglement</p>
                    <p className="text-sm font-medium">{gareReglement}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">N° PP</p>
                    <p className="text-sm font-medium">{numPP}</p>
                  </div>
                  {isBillet && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Montant Réglé</p>
                      <p className="text-sm font-medium">{montantRegle} MAD</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Status selection */}
              <div className="flex gap-3 mb-4">
                {['REGULARISEE', 'NON_REGULARISEE'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setInfractionStatus(status)
                      setInfractionSaved(false)
                    }}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium
                               transition
                               ${infractionStatus === status
                                 ? 'border-orange-500 bg-orange-50 text-orange-700'
                                 : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {status === 'REGULARISEE' ? '✅ Régularisée' : '❌ Non Régularisée'}
                  </button>
                ))}
              </div>

              {/* Extra fields if Régularisée */}
              {infractionStatus === 'REGULARISEE' && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gare de Réglement
                    </label>
                    <select
                      value={gareReglement}
                      onChange={(e) => setGareReglement(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 text-sm focus:outline-none focus:ring-1"
                    >
                      <option value="">Sélectionner une gare...</option>
                      {['KENITRA', 'SALE TABRIQUET', 'RABAT VILLE', 'RABAT AGDAL',
                        'CASABLANCA VOYAGEURS', 'CASA PORT', 'MOHAMMEDIA', 'TEMARA',
                        'SETTAT', 'MEKNES VILLE', 'FES', 'TANGER VILLE', 'MARRAKECH',
                        'OUJDA', 'NADOR'].map(gare => (
                        <option key={gare} value={gare}>{gare}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° PP de Régularisation
                    </label>
                    <input
                      type="text"
                      value={numPP}
                      onChange={(e) => setNumPP(e.target.value)}
                      placeholder="Ex: PP-2026-001"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 text-sm focus:outline-none focus:ring-1"
                    />
                  </div>

                  {isBillet && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Montant Réglé (MAD)
                      </label>
                      <input
                        type="number"
                        value={montantRegle}
                        onChange={(e) => setMontantRegle(e.target.value)}
                        placeholder="Ex: 150"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2
                                   text-sm focus:outline-none focus:ring-1"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Save button */}
              {infractionStatus && (
                <button
                  onClick={() => infractionMutation.mutate({
                    statut: infractionStatus,
                    gareReglement: gareReglement || null,
                    montantRegle: montantRegle ? parseFloat(montantRegle) : null,
                    numPP: numPP || null
                  })}
                  disabled={!canSaveInfraction || infractionMutation.isPending}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium
                             transition disabled:opacity-50"
                  style={{ backgroundColor: '#E8500A' }}
                >
                  {infractionMutation.isPending ? 'Saving...' : 'Save Infraction Status'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Decision Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!showDecisionConfirm}
        title={`${showDecisionConfirm?.decision} Suggestion`}
        message={`Are you sure you want to ${showDecisionConfirm?.decision?.toLowerCase()} this suggestion?`}
        confirmLabel={showDecisionConfirm?.decision}
        danger={showDecisionConfirm?.decision === 'REJECTED'}
        onConfirm={() => {
          decideMutation.mutate({
            suggestionId: showDecisionConfirm.suggestionId,
            decision: showDecisionConfirm.decision
          })
          setShowDecisionConfirm(null)
        }}
        onCancel={() => setShowDecisionConfirm(null)}
      />

      {/* Confirm Form Dialog */}
      <ConfirmDialog
        isOpen={showConfirmFormDialog}
        title="Confirm Form"
        message="Are you sure you want to confirm this form? This action cannot be undone."
        confirmLabel="Yes, Confirm"
        onConfirm={() => {
          confirmMutation.mutate()
          setShowConfirmFormDialog(false)
        }}
        onCancel={() => setShowConfirmFormDialog(false)}
      />

      {/* Archive Form Dialog */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        title="Archive Form"
        message="Are you sure you want to archive this form?"
        confirmLabel="Archive"
        danger={true}
        onConfirm={() => {
          archiveMutation.mutate()
          setShowArchiveConfirm(false)
        }}
        onCancel={() => setShowArchiveConfirm(false)}
      />
    </Layout>
  )
}