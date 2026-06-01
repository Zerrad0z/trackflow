import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: '#1A1A1A',
              color: '#fff',
              borderLeft: '4px solid #E8500A'
            }
          },
          error: {
            style: {
              background: '#1A1A1A',
              color: '#fff',
              borderLeft: '4px solid #EF4444'
            }
          }
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)