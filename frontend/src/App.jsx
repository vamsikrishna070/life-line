import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Toast from './components/Toast'
import FindDonors from './pages/FindDonors'
import LiveRequests from './pages/LiveRequests'
import AdminPanel from './pages/AdminPanel'
import AdminDashboard from './pages/AdminDashboard'
import RegisterDonor from './pages/RegisterDonor'
import Login from './pages/Login'
import Register from './pages/Register'
import DonorDashboard from './pages/DonorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import HospitalDashboard from './pages/HospitalDashboard'
import './App.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token } = useApp()
  return token ? children : <Navigate to="/login" replace />
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, token } = useApp()
  if (!token) return <Navigate to="/login" replace />
  if (user?.type !== 'admin' && user?.type !== 'hospital') return <Navigate to="/donor-dashboard" replace />
  return children
}

// Donor Route Component
const DonorRoute = ({ children }) => {
  const { user, token } = useApp()
  if (!token) return <Navigate to="/login" replace />
  if (user?.type !== 'donor') return <Navigate to="/patient-dashboard" replace />
  return children
}

// Patient Route Component
const PatientRoute = ({ children }) => {
  const { user, token } = useApp()
  if (!token) return <Navigate to="/login" replace />
  if (user?.type !== 'patient') return <Navigate to="/donor-dashboard" replace />
  return children
}

// Hospital Route Component
const HospitalRoute = ({ children }) => {
  const { user, token } = useApp()
  if (!token) return <Navigate to="/login" replace />
  if (user?.type !== 'hospital') return <Navigate to="/donor-dashboard" replace />
  return children
}

function AppContent() {
  return (
    <div className="App">
      <Header />
      <Toast />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard Routes */}
        <Route path="/donor-dashboard" element={
          <DonorRoute>
            <DonorDashboard />
          </DonorRoute>
        } />
        <Route path="/patient-dashboard" element={
          <PatientRoute>
            <PatientDashboard />
          </PatientRoute>
        } />
        <Route path="/hospital-dashboard" element={
          <HospitalRoute>
            <HospitalDashboard />
          </HospitalRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        {/* Protected Routes (Legacy/Additional) */}
        <Route path="/" element={
          <ProtectedRoute>
            <FindDonors />
          </ProtectedRoute>
        } />
        <Route path="/find-donors" element={
          <ProtectedRoute>
            <FindDonors />
          </ProtectedRoute>
        } />
        <Route path="/requests" element={
          <ProtectedRoute>
            <LiveRequests />
          </ProtectedRoute>
        } />
        <Route path="/register-donor" element={
          <ProtectedRoute>
            <RegisterDonor />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  )
}

export default App
