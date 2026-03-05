import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DAY_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

function calculateAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDate(date) {
  return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Dashboard() {
  const { api, trainer } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [todayClients, setTodayClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', birth_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const today = new Date()
  const todayDow = today.getDay()

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/clients/today/scheduled'),
    ]).then(([allRes, todayRes]) => {
      setClients(allRes.data)
      setTodayClients(todayRes.data)
    }).finally(() => setLoading(false))
  }, [api])

  async function handleAddClient(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/clients', form)
      setClients([...clients, res.data])
      setForm({ name: '', email: '', birth_date: '', notes: '' })
      setShowAddForm(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">Dashboard</h1>
          <p className="text-dark-muted mt-1">Welkom terug, {trainer?.name}!</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Klant toevoegen
        </button>
      </div>

      {/* Vandaag */}
      <div className="card mb-8" style={{ borderLeft: '4px solid #063854' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(6,56,84,0.08)' }}>
            <svg className="w-5 h-5 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold font-heading text-brand-700">Vandaag — {DAY_FULL[todayDow]}</h2>
            <p className="text-xs text-dark-muted">{formatDate(today)}</p>
          </div>
        </div>

        {todayClients.length === 0 ? (
          <p className="text-dark-muted text-sm py-2">
            Geen klanten ingepland voor vandaag. Stel roosters in via de klantpagina.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayClients.map(client => {
              const age = calculateAge(client.birth_date)
              return (
                <div
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm"
                  style={{ backgroundColor: 'rgba(6,56,84,0.04)', border: '1px solid rgba(6,56,84,0.12)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-heading flex-shrink-0 text-white" style={{ backgroundColor: '#063854' }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold font-heading text-dark text-sm truncate">{client.name}</p>
                    {age !== null && <p className="text-xs text-dark-muted">{age} jaar</p>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/log-workout?clientId=${client.id}`) }}
                    className="flex-shrink-0 px-3 py-2 min-h-[44px] rounded text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors"
                    style={{ backgroundColor: '#063854' }}
                  >
                    Log
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-700">{clients.length}</p>
          <p className="text-sm text-dark-muted mt-1">Klanten</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-brand-700">{todayClients.length}</p>
          <p className="text-sm text-dark-muted mt-1">Vandaag</p>
        </div>
      </div>

      {/* Add client form */}
      {showAddForm && (
        <div className="card mb-6 border-brand-200">
          <h3 className="font-semibold font-heading text-brand-700 mb-4">Nieuwe klant</h3>
          <form onSubmit={handleAddClient} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Naam *</label>
              <input required className="input" placeholder="Voornaam Achternaam" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" placeholder="klant@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Geboortedatum</label>
              <input type="date" className="input" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Notities</label>
              <input className="input" placeholder="Blessures, doelen, ..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Opslaan...' : 'Klant toevoegen'}</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Annuleren</button>
            </div>
          </form>
        </div>
      )}

      {/* Client grid */}
      <h2 className="font-bold font-heading text-dark mb-4">Alle klanten ({clients.length})</h2>

      {clients.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👋</div>
          <h3 className="text-lg font-semibold font-heading text-dark">Voeg je eerste klant toe</h3>
          <p className="text-dark-subtle mt-1">Klik op "Klant toevoegen" om te beginnen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => {
            const age = calculateAge(client.birth_date)
            const isToday = todayClients.some(t => t.id === client.id)
            return (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="card cursor-pointer hover:shadow-md hover:border-brand-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold font-heading flex-shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    {isToday && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" title="Vandaag ingepland" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold font-heading text-dark truncate">{client.name}</h3>
                      {isToday && (
                        <span className="text-xs font-heading font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0" style={{ backgroundColor: '#063854', fontSize: '9px' }}>VANDAAG</span>
                      )}
                    </div>
                    {age !== null && <p className="text-sm text-dark-muted">{age} jaar</p>}
                    {client.email && <p className="text-sm text-dark-subtle truncate">{client.email}</p>}
                    {client.notes && <p className="text-xs text-dark-subtle mt-1 truncate italic">{client.notes}</p>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-border">
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/log-workout?clientId=${client.id}`) }}
                      className="btn-primary flex-1 text-xs"
                    >
                      Log workout
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/progress/${client.id}`) }}
                      className="btn-secondary flex-1 text-xs"
                    >
                      Voortgang
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
