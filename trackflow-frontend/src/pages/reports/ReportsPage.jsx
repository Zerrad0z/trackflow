import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../../components/common/Layout'
import { reportService } from '../../services/reportService'
import { Download, Plus, X, FileText } from 'lucide-react'

export default function ReportsPage() {
  const [showGenerate, setShowGenerate] = useState(false)
  const [reportType, setReportType] = useState('WEEKLY')
  const [format, setFormat] = useState('PDF')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getMyReports().then(r => r.data)
  })

  const generateMutation = useMutation({
    mutationFn: (data) => reportService.generateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports'])
      setShowGenerate(false)
    }
  })

  const handleDownload = async (reportId, reportType) => {
    try {
      const response = await reportService.downloadReport(reportId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report_${reportType}.${format.toLowerCase()}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const reports = data?.content || []

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white
                     px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Generate Report
        </button>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex
                        items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generate Report</h3>
              <button onClick={() => setShowGenerate(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg
                             px-3 py-2 focus:outline-none focus:ring-2
                             focus:ring-blue-500"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <div className="flex gap-3">
                  {['PDF', 'EXCEL'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-2 rounded-lg border transition
                                 ${format === f
                                   ? 'border-blue-600 bg-blue-50 text-blue-600'
                                   : 'border-gray-300 text-gray-600'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => generateMutation.mutate({ reportType, format })}
                disabled={generateMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded-lg
                           hover:bg-blue-700 transition disabled:opacity-50"
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reports yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium
                               text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium
                               text-gray-500 uppercase">Generated By</th>
                <th className="text-left px-6 py-3 text-xs font-medium
                               text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium
                               text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {report.reportType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {report.generatedByName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(report.generatedAt).toLocaleDateString('fr-MA')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDownload(report.id, report.reportType)}
                      className="flex items-center gap-1 text-blue-600
                                 hover:text-blue-800 text-sm"
                    >
                      <Download size={16} />
                      Download
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