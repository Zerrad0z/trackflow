import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App