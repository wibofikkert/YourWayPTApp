import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientDetail from './pages/ClientDetail'
import LogWorkout from './pages/LogWorkout'
import Progress from './pages/Progress'
import Exercises from './pages/Exercises'
import AdminDashboard from './pages/AdminDashboard'
import EditWorkout from './pages/EditWorkout'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/log-workout" element={<LogWorkout />} />
              <Route path="/edit-workout/:sessionId" element={<EditWorkout />} />
              <Route path="/progress/:clientId" element={<Progress />} />
              <Route path="/progress/:clientId/:exerciseId" element={<Progress />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route element={<ProtectedAdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
