import { AlertTriangle } from 'lucide-react'
import { useLanguage } from "../../context/LanguageContext";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = false
}) {
  const { t } = useLanguage()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex
                    items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center
                          ${danger ? 'bg-red-100' : 'bg-orange-100'}`}>
            <AlertTriangle size={20}
              className={danger ? 'text-red-600' : 'text-orange-600'} />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-2
                       rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            {cancelLabel || t('confirmDialog.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-white py-2 rounded-lg text-sm
                       font-medium transition"
            style={{ backgroundColor: danger ? '#EF4444' : '#E8500A' }}
          >
            {confirmLabel || t('confirmDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}