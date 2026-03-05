import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }
      const res = await axios.post(`${BASE_URL}${endpoint}`, payload)
      login(res.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Er ging iets mis. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#063854' }}>
      {/* Left: branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* subtle background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px'
        }} />
        <div className="relative z-10 text-center">
          <img
            src="/assets/logo-white.png"
            alt="YourWayPT"
            className="h-28 w-auto object-contain mx-auto mb-10"
          />
          <p className="text-white text-xl font-heading font-semibold leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Jouw stok achter de deur op weg naar een fitter leven
          </p>
          <div className="mt-10 flex flex-col gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Klantenbeheer
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Workout tracking
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              Voortgangsgrafieken
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              75+ oefeningen database
            </div>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-surface">
        {/* Mobile logo banner — donkerblauw */}
        <div className="lg:hidden w-full flex items-center justify-center py-8 px-6" style={{ backgroundColor: '#063854' }}>
          <img
            src="/assets/logo-white.png"
            alt="YourWayPT"
            className="h-20 w-auto object-contain"
          />
        </div>

        <div className="w-full max-w-sm p-6 lg:p-0">
          <h2 className="text-2xl font-bold font-heading text-brand-700 mb-2 mt-6 lg:mt-0">
            {mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </h2>
          <p className="text-dark-muted text-sm mb-8">
            {mode === 'login'
              ? 'Welkom terug. Log in om verder te gaan.'
              : 'Maak een nieuw trainer account aan.'}
          </p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="label">Naam</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Voornaam Achternaam"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="label">E-mailadres</label>
              <input
                type="email"
                required
                className="input"
                placeholder="trainer@yourwaypt.nl"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Wachtwoord</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="Minimaal 6 tekens"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Even geduld...' : (mode === 'login' ? 'Inloggen' : 'Account aanmaken')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-muted">
            {mode === 'login' ? 'Nog geen account?' : 'Al een account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-brand-500 hover:text-brand-700 font-semibold font-heading inline-flex items-center min-h-[44px] px-1"
            >
              {mode === 'login' ? 'Registreer hier' : 'Inloggen'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
