import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedAdminRoute() {
  const { trainer, loading } = useAuth()

  if (loading) return null

  if (!trainer) return <Navigate to="/login" replace />
  if (!trainer.is_admin) return <Navigate to="/" replace />

  return <Outlet />
}
