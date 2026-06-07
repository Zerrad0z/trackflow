import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { formService } from '../../services/formService'
import { useLanguage } from '../../context/LanguageContext'
import {
  CheckCircle, XCircle, Edit3, ArrowLeft,
  FileText, ClipboardList, Plus, X, Archive
} from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import ConfirmDialog from '../../components/common/ConfirmDialog'

export default function FormDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { t } = useLanguage()
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
    enabled: !!form,
    retry: false
  })

  const isLettreSommation = form?.formType === 'LETTRE_SOMMATION_BILLET' ||
                            form?.formType === 'LETTRE_SOMMATION_CARTE'
  const isBillet = form?.formType === 'LETTRE_SOMMATION_BILLET'

  const isFormValidatedByManager = form?.validatedByManager === true

  const canSupervisorConfirm = !!form && form.formStatus !== 'CONFIRMED' && form.formStatus !== 'ARCHIVED' && (
    (form.formStatus === 'PENDING_CONFIRMATION' && (!isLettreSommation || infractionSaved)) ||
    (validation && validation.status === 'COMPLETED' && (validation.suggestions?.length || 0) === 0)
  )

  const decideMutation = useMutation({
    mutationFn: ({ suggestionId, decision, overrideValue }) =>
      api.patch(`/suggestions/${suggestionId}/decide`, { decision, overrideValue }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['validation', id])
      toast.success(`${t('formDetail.suggestion')} ${t(`formDetail.decisionStatus.${variables.decision}`).toLowerCase()}`)
    },
    onError: () => toast.error(t('formDetail.decisionFailed'))
  })

  const confirmMutation = useMutation({
    mutationFn: () => formService.confirmForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['form', id])
      toast.success(t('formDetail.confirmSuccess'))
    },
    onError: () => toast.error(t('formDetail.confirmFailed'))
  })

  const archiveMutation = useMutation({
    mutationFn: () => formService.archiveForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['form', id])
      toast.success(t('formDetail.archiveSuccess'))
      navigate('/forms')
    },
    onError: () => toast.error(t('formDetail.archiveFailed'))
  })

  const infractionMutation = useMutation({
    mutationFn: (data) => api.patch(`/forms/${id}/infraction-status`, data),
    onSuccess: () => {
      setInfractionSaved(true)
      toast.success(t('formDetail.infractionSaved'))
      queryClient.invalidateQueries(['fields', id])
    },
    onError: () => toast.error(t('formDetail.infractionFailed'))
  })

  const validateMutation = useMutation({
    mutationFn: () => formService.triggerValidation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['form', id])
      toast.success(t('formDetail.validateSuccess'))
    },
    onError: () => toast.error(t('formDetail.validateFailed'))
  })

  const enterEditMode = () => {
    const values = {}
    mergedFields.forEach(f => { values[f.fieldName] = f.extractedValue || '' })
    extraFields.forEach(f => { values[f.fieldName] = f.extractedValue || '' })
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
      toast.success(
        user?.role === 'MANAGER'
          ? t('formDetail.fieldsUpdatedManager')
          : t('formDetail.fieldsUpdated')
      )
    },
    onError: () => toast.error(t('formDetail.fieldsUpdateFailed'))
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
      toast.success(t('formDetail.fieldAdded'))
    },
    onError: () => toast.error(t('formDetail.fieldAddFailed'))
  })

  const decisionColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    OVERRIDDEN: 'bg-purple-100 text-purple-700',
  }

  const infractionFieldNames = ['statut', 'gare_reglement', 'montant_regle', 'num_pp']

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

  const extraFields = fields?.filter(f =>
    !schema?.find(s => s.fieldName === f.fieldName) &&
    !infractionFieldNames.includes(f.fieldName)
  ) || []

  const isManager = user?.role === 'MANAGER'
  const showValidationTab = user?.role !== 'MANAGER' && form?.formStatus !== 'CONFIRMED' && form?.formStatus !== 'ARCHIVED'
  const canManagerAct = form?.formStatus === 'CONFIRMED' && !form?.validatedByManager
  const canEditFields = isManager 
    ? canManagerAct 
    : (form?.formStatus !== 'ARCHIVED' && form?.formStatus !== 'CONFIRMED')

  useEffect(() => {
    if (!showValidationTab && activeTab === 'validation') {
      setActiveTab('fields')
    }
  }, [showValidationTab, activeTab])

  return (
    <Layout>
      {/* Back button and Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/forms')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm"
        >
          <ArrowLeft size={16} />
          {t('formDetail.backToForms')}
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
              {t('formDetail.archive')}
            </button>
          </div>
        )}
        {user?.role === 'MANAGER' && form && canManagerAct && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                         font-medium text-white transition disabled:opacity-50"
              style={{ backgroundColor: '#E8500A' }}
            >
              {validateMutation.isPending ? (
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                </span>
              ) : (
                <CheckCircle size={16} />
              )}
              {validateMutation.isPending ? t('formDetail.validating') : t('formDetail.validateForm')}
            </button>
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                         font-medium border border-gray-300 text-gray-600
                         hover:bg-gray-50 transition"
            >
              <Archive size={16} />
              {t('formDetail.archive')}
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
                  {t(`forms.types.${form.formType}`) || form.formType.replace(/_/g, ' ')}
                </h2>
                <p className="text-xs text-gray-500">
                  {t('formDetail.formId')}: {form.id?.substring(0, 8)}...
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium
              ${form.formStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                form.formStatus === 'ARCHIVED' ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-700'}`}>
              {t(`forms.statuses.${form.formStatus}`) || form.formStatus?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{t('formDetail.uploadedBy')}</p>
              <p className="font-medium">{form.uploadedBy?.fullName}</p>
            </div>
            <div>
              <p className="text-gray-500">{t('common.date')}</p>
              <p className="font-medium">
                {new Date(form.uploadedAt).toLocaleDateString('fr-MA')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">
                {form.validatedByManager ? t('formDetail.validatedBy') : t('formDetail.confirmedBy')}
              </p>
              <p className="font-medium">
                {(form.validatedByManager ? form.validatedByManagerBy?.fullName : form.confirmedBy?.fullName) || '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isManager && form && !canManagerAct && form.formStatus !== 'ARCHIVED' && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t('formDetail.managerWaitMessage')}
        </div>
      )}

    

      {user?.role === 'FIELD_SUPERVISOR' && form && (
        <div className="mb-6 flex items-center gap-3">
          {canSupervisorConfirm ? (
            <button
              onClick={() => setShowConfirmFormDialog(true)}
              disabled={confirmMutation.isPending}
              className="flex items-center gap-2 text-white px-4 py-2
                         rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: '#E8500A' }}
            >
              <CheckCircle size={16} />
              {confirmMutation.isPending ? t('formDetail.confirming') : t('formDetail.confirmForm')}
            </button>
          ) : form.formStatus === 'CONFIRMED' && isFormValidatedByManager ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle size={16} />
              {t('formDetail.formValidatedLocked')}
            </div>
          ) : form.formStatus === 'CONFIRMED' ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <CheckCircle size={16} />
              {t('formDetail.formConfirmedWaiting')}
            </div>
          ) : form.formStatus !== 'ARCHIVED' && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500">
              <CheckCircle size={16} />
              {form.formStatus === 'PENDING_CONFIRMATION' && isLettreSommation && !infractionSaved
                ? t('formDetail.saveInfractionFirst')
                : t('formDetail.confirmAfterValidation')}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {user?.role !== 'MANAGER' && (
      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm
                      border w-fit">
        {[
          { id: 'fields', label: t('formDetail.formFields'), icon: <ClipboardList size={15} /> },
          ...(showValidationTab ? [{ id: 'validation', label: t('formDetail.aiValidation'), icon: <CheckCircle size={15} /> }] : [])
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
      )}

      {/* Fields Tab */}
      {(activeTab === 'fields' || user?.role === 'MANAGER') && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-800">{t('formDetail.extractedFields')}</h3>
            <div className="flex items-center gap-2">
              {!editMode && canEditFields && (
                <>
                  {(user?.role === 'FIELD_SUPERVISOR' || canManagerAct) && (
                  <button
                    onClick={enterEditMode}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg border transition hover:bg-gray-50"
                    style={{ borderColor: '#E8500A', color: '#E8500A' }}
                  >
                    <Edit3 size={14} />
                    {t('formDetail.editFields')}
                  </button>
                  )}
                  {user?.role === 'FIELD_SUPERVISOR' && form?.formStatus !== 'CONFIRMED' && (
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg text-white transition"
                    style={{ backgroundColor: '#E8500A' }}
                  >
                    <Plus size={14} />
                    {t('formDetail.addField')}
                  </button>
                  )}
                </>
              )}
              {editMode && canEditFields && (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg border border-gray-300 text-gray-600
                               hover:bg-gray-50 transition"
                  >
                    <X size={14} />
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveFields}
                    disabled={updateFieldsMutation.isPending}
                    className="flex items-center gap-1 text-sm px-3 py-1.5
                               rounded-lg text-white transition disabled:opacity-50"
                    style={{ backgroundColor: '#E8500A' }}
                  >
                    <CheckCircle size={14} />
                    {updateFieldsMutation.isPending ? t('formDetail.saving') : t('formDetail.saveChanges')}
                  </button>
                </>
              )}
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[t('formDetail.field'), t('formDetail.extractedValue'), t('formDetail.confirmedValue')].map(h => (
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
                    {editMode && canEditFields ? (
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
                        <span className="text-xs text-gray-400 italic">{t('formDetail.notExtracted')}</span>
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
                </tr>
              ))}
              {extraFields.map(field => (
                <tr key={field.id} className="hover:bg-gray-50 bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {field.fieldName}
                      </p>
                      <p className="text-xs text-blue-400">{t('formDetail.extraField')}</p>
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
                </tr>
              ))}
            </tbody>
          </table>

          {/* Infraction Status Summary */}
          {isLettreSommation &&
           (form?.formStatus === 'CONFIRMED' || form?.formStatus === 'ARCHIVED') && (
            <div className="border-t mt-2 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#E8500A' }} />
                {t('formDetail.infractionStatus')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: t('formDetail.statut'), fieldName: 'statut' },
                  { label: t('formDetail.gareReglement'), fieldName: 'gare_reglement' },
                  { label: t('formDetail.numPP'), fieldName: 'num_pp' },
                  ...(isBillet ? [{ label: t('formDetail.montantRegle'), fieldName: 'montant_regle' }] : [])
                ].map(item => {
                  const value = fields?.find(f => f.fieldName === item.fieldName)?.confirmedValue
                  const currentStatut = editMode
                    ? (editValues['statut'] ?? fields?.find(f => f.fieldName === 'statut')?.confirmedValue)
                    : fields?.find(f => f.fieldName === 'statut')?.confirmedValue
                  if (item.fieldName !== 'statut' && currentStatut === 'NON_REGULARISEE') return null
                  return (
                    <div key={item.fieldName} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      {editMode && canEditFields ? (
                        item.fieldName === 'statut' ? (
                          <select
                            value={editValues[item.fieldName] ?? value ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, [item.fieldName]: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1"
                          >
                            <option value="">{t('formDetail.select')}</option>
                            <option value="REGULARISEE">✅ {t('formDetail.regularisee')}</option>
                            <option value="NON_REGULARISEE">❌ {t('formDetail.nonRegularisee')}</option>
                          </select>
                        ) : item.fieldName === 'gare_reglement' ? (
                          <select
                            value={editValues[item.fieldName] ?? value ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, [item.fieldName]: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1"
                          >
                            <option value="">{t('formDetail.selectGare')}</option>
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
                <h3 className="font-semibold mb-4">{t('formDetail.addMissingField')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {t('formDetail.fieldName')}
                    </label>
                    <select
                      value={newField.fieldName}
                      onChange={(e) => setNewField({...newField, fieldName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 focus:outline-none focus:ring-2 text-sm"
                    >
                      <option value="">{t('formDetail.selectField')}</option>
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
                      {t('formDetail.value')}
                    </label>
                    <input
                      type="text"
                      value={newField.extractedValue}
                      onChange={(e) => setNewField({...newField, extractedValue: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 focus:outline-none focus:ring-2 text-sm"
                      placeholder={t('formDetail.enterValue')}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowAddField(false)}
                      className="flex-1 border border-gray-300 text-gray-700
                                 py-2 rounded-lg text-sm hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={() => addFieldMutation.mutate(newField)}
                      disabled={!newField.fieldName || !newField.extractedValue}
                      className="flex-1 text-white py-2 rounded-lg text-sm
                                 disabled:opacity-50 transition"
                      style={{ backgroundColor: '#E8500A' }}
                    >
                      {t('formDetail.addField')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && user?.role !== 'MANAGER' && showValidationTab && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">{t('formDetail.aiValidationResults')}</h3>
          {validationLoading ? (
            <p className="text-gray-500">{t('common.loading')}</p>
          ) : !validation ? (
            <p className="text-gray-500">{t('formDetail.noValidation')}</p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${validation.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'}`}>
                  {t(`formDetail.validationStatus.${validation.status}`) || validation.status}
                </span>
                <span className="text-sm text-gray-500">
                  {validation.suggestions?.length || 0} {t('formDetail.suggestions')}
                </span>
              </div>

              {validation.suggestions?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                  <p>{t('formDetail.noErrors')}</p>
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
                            {t('formDetail.extracted')}: <span className="font-mono bg-gray-100 px-1 rounded">
                              {suggestion.extractedValue || '—'}
                            </span>
                          </p>
                          {suggestion.suggestedValue && (
                            <p className="text-sm mt-1" style={{ color: '#E8500A' }}>
                              {t('formDetail.suggested')}: <span className="font-mono bg-orange-50 px-1 rounded">
                                {suggestion.suggestedValue}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{suggestion.reason}</p>
                          <p className="text-xs text-gray-400">
                            {t('formDetail.confidence')}: {Math.round(suggestion.confidence * 100)}%
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                                         ${decisionColors[suggestion.decision]}`}>
                          {t(`formDetail.decisionStatus.${suggestion.decision}`) || suggestion.decision}
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
                            <CheckCircle size={14} /> {t('formDetail.accept')}
                          </button>
                          <button
                            onClick={() => setShowDecisionConfirm({
                              suggestionId: suggestion.id,
                              decision: 'REJECTED'
                            })}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50
                                       text-red-700 rounded hover:bg-red-100 text-sm"
                          >
                            <XCircle size={14} /> {t('formDetail.reject')}
                          </button>
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              placeholder={t('formDetail.overrideValue')}
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
                              <Edit3 size={14} /> {t('formDetail.override')}
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

      {/* Infraction Status Section */}
      {isLettreSommation &&
       activeTab === 'validation' &&
       form?.formStatus !== 'ARCHIVED' &&
       form?.formStatus !== 'CONFIRMED' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{t('formDetail.infractionStatus')}</h3>
            {infractionSaved && form?.formStatus !== 'CONFIRMED' && (
              <button
                onClick={() => {
                  setInfractionSaved(false)
                  setInfractionStatus('')
                }}
                className="text-sm flex items-center gap-1"
                style={{ color: '#E8500A' }}
              >
                <Edit3 size={14} /> {t('formDetail.modify')}
              </button>
            )}
          </div>

          {infractionSaved ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">{t('formDetail.statut')}</p>
                <p className={`text-sm font-medium ${
                  infractionStatus === 'REGULARISEE' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {infractionStatus === 'REGULARISEE' ? `✅ ${t('formDetail.regularisee')}` : `❌ ${t('formDetail.nonRegularisee')}`}
                </p>
              </div>
              {infractionStatus === 'REGULARISEE' && (
                <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">{t('formDetail.gareReglement')}</p>
                    <p className="text-sm font-medium">{gareReglement}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">{t('formDetail.numPP')}</p>
                    <p className="text-sm font-medium">{numPP}</p>
                  </div>
                  {isBillet && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{t('formDetail.montantRegle')}</p>
                      <p className="text-sm font-medium">{montantRegle} MAD</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
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
                    {status === 'REGULARISEE' ? `✅ ${t('formDetail.regularisee')}` : `❌ ${t('formDetail.nonRegularisee')}`}
                  </button>
                ))}
              </div>

              {infractionStatus === 'REGULARISEE' && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('formDetail.gareReglement')}
                    </label>
                    <select
                      value={gareReglement}
                      onChange={(e) => setGareReglement(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 text-sm focus:outline-none focus:ring-1"
                    >
                      <option value="">{t('formDetail.selectGare')}</option>
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
                      {t('formDetail.numPPRegularisation')}
                    </label>
                    <input
                      type="text"
                      value={numPP}
                      onChange={(e) => setNumPP(e.target.value)}
                      placeholder={t('formDetail.numPPPlaceholder')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2
                                 text-sm focus:outline-none focus:ring-1"
                    />
                  </div>

                  {isBillet && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('formDetail.montantRegleMAD')}
                      </label>
                      <input
                        type="number"
                        value={montantRegle}
                        onChange={(e) => setMontantRegle(e.target.value)}
                        placeholder={t('formDetail.montantPlaceholder')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2
                                   text-sm focus:outline-none focus:ring-1"
                      />
                    </div>
                  )}
                </div>
              )}

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
                  {infractionMutation.isPending ? t('formDetail.saving') : t('formDetail.saveInfractionStatus')}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Decision Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!showDecisionConfirm}
        title={`${t(`formDetail.decisionStatus.${showDecisionConfirm?.decision}`)} ${t('formDetail.suggestion')}`}
        message={t('formDetail.decisionConfirmMessage', { decision: t(`formDetail.decisionStatus.${showDecisionConfirm?.decision}`).toLowerCase() })}
        confirmLabel={t(`formDetail.decisionStatus.${showDecisionConfirm?.decision}`)}
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
        title={t('formDetail.confirmForm')}
        message={t('formDetail.confirmFormMessage')}
        confirmLabel={t('formDetail.yesConfirm')}
        onConfirm={() => {
          confirmMutation.mutate()
          setShowConfirmFormDialog(false)
        }}
        onCancel={() => setShowConfirmFormDialog(false)}
      />

      {/* Archive Form Dialog */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        title={t('formDetail.archiveForm')}
        message={t('formDetail.archiveFormMessage')}
        confirmLabel={t('formDetail.archive')}
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