import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { to: '/log-workout', label: 'Log Workout', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )},
  { to: '/exercises', label: 'Oefeningen', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  )},
]

const adminNavItem = {
  to: '/admin',
  label: 'Beheer',
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

export default function Layout() {
  const { trainer, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = trainer?.name
    ? trainer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PT'

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ backgroundColor: '#063854' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <img
            src="/assets/logo-white.png"
            alt="YourWayPT"
            className="h-14 w-auto object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {[...navItems, ...(trainer?.is_admin ? [adminNavItem] : [])].map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded text-sm font-heading font-semibold tracking-wider uppercase transition-all ${
                  isActive
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-white hover:bg-white hover:bg-opacity-10'
                }`
              }
              style={({ isActive }) => isActive ? {} : { color: 'rgba(255,255,255,0.85)' }}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Trainer profile */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-xs font-bold font-heading flex-shrink-0 text-brand-700">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold font-heading text-white truncate">{trainer?.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{trainer?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="icon-btn transition-opacity hover:opacity-100"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              title="Uitloggen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-3 py-2 flex-shrink-0" style={{ backgroundColor: '#063854', minHeight: '56px' }}>
          <button onClick={() => setSidebarOpen(true)} className="icon-btn flex-shrink-0" style={{ color: 'rgba(255,255,255,0.9)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/assets/logo-white.png" alt="YourWayPT" className="h-8 w-auto object-contain" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
