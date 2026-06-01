import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Train, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#1A1A1A' }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center
                      justify-center p-12"
           style={{ backgroundColor: '#E8500A' }}>
        <Train size={80} className="text-white mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">TrackFlow</h1>
        <p className="text-orange-100 text-lg text-center max-w-sm">
          Field Form Digitalization and AI Validation Platform
        </p>
        <div className="mt-12 space-y-4 w-full max-w-sm">
          {['OCR Form Scanning', 'AI-Powered Validation', 'Real-time Notifications',
            'PDF & Excel Reports'].map(feature => (
            <div key={feature} className="flex items-center gap-3 text-white">
              <div className="w-2 h-2 rounded-full bg-orange-200" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Train size={48} style={{ color: '#E8500A' }} className="mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-white">TrackFlow</h1>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500 mb-8">Sign in to your account</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600
                             px-4 py-3 rounded-lg mb-6 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10
                               pr-3 py-2.5 focus:outline-none focus:ring-2
                               focus:border-transparent text-sm"
                    style={{ '--tw-ring-color': '#E8500A' }}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-10
                               pr-3 py-2.5 focus:outline-none focus:ring-2
                               focus:border-transparent text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-medium
                           transition-all duration-150 disabled:opacity-50
                           hover:opacity-90 mt-2"
                style={{ backgroundColor: '#E8500A' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            TrackFlow — ONCF Field Operations Platform
          </p>
        </div>
      </div>
    </div>
  )
}