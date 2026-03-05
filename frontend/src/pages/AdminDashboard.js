import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, icon }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(6,56,84,0.08)' }}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold font-heading text-brand-700">{value ?? '—'}</p>
        <p className="text-sm text-dark-muted">{label}</p>
      </div>
    </div>
  )
}

function TrainerModal({ trainer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: trainer?.name || '',
    email: trainer?.email || '',
    password: '',
    is_active: trainer ? trainer.is_active : 1,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { api } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (trainer) {
        const payload = {
          name: form.name,
          email: form.email,
          is_active: form.is_active,
        }
        if (form.password) payload.password = form.password
        const res = await api.put(`/admin/trainers/${trainer.id}`, payload)
        onSave(res.data)
      } else {
        const res = await api.post('/admin/trainers', {
          name: form.name,
          email: form.email,
          password: form.password,
        })
        onSave(res.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Er ging iets mis.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="font-bold font-heading text-dark text-lg">
            {trainer ? 'Trainer bewerken' : 'Nieuwe trainer'}
          </h3>
          <button onClick={onClose} className="text-dark-subtle hover:text-dark p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="label">Naam</label>
            <input
              type="text"
              required
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">E-mailadres</label>
            <input
              type="email"
              required
              className="input"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{trainer ? 'Nieuw wachtwoord (leeg = niet wijzigen)' : 'Wachtwoord'}</label>
            <input
              type="password"
              required={!trainer}
              minLength={trainer ? 0 : 6}
              className="input"
              placeholder={trainer ? 'Laat leeg om ongewijzigd te laten' : 'Minimaal 6 tekens'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {trainer && (
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.is_active === 1}
                  onChange={e => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
              <span className="text-sm text-dark font-medium">Account actief</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-border rounded font-heading font-semibold text-sm text-dark hover:bg-surface transition-colors uppercase tracking-wider">
              Annuleren
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReassignModal({ client, trainers, onClose, onSaved }) {
  const { api } = useAuth()
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const otherTrainers = trainers.filter(t => t.id !== client.trainer_id && t.is_active)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedTrainerId) return
    setSaving(true)
    setError('')
    try {
      const res = await api.put(`/admin/clients/${client.id}/reassign`, { trainer_id: parseInt(selectedTrainerId) })
      onSaved(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Er ging iets mis.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="font-bold font-heading text-dark text-lg">Klant verplaatsen</h3>
          <button onClick={onClose} className="text-dark-subtle hover:text-dark p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
          <p className="text-sm text-dark-muted">
            Verplaats <strong>{client.name}</strong> naar een andere trainer.
          </p>
          <div>
            <label className="label">Nieuwe trainer</label>
            <select
              required
              className="input"
              value={selectedTrainerId}
              onChange={e => setSelectedTrainerId(e.target.value)}
            >
              <option value="">— Kies trainer —</option>
              {otherTrainers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-surface-border rounded font-heading font-semibold text-sm text-dark hover:bg-surface transition-colors uppercase tracking-wider">
              Annuleren
            </button>
            <button type="submit" disabled={saving || !selectedTrainerId} className="flex-1 btn-primary py-2.5">
              {saving ? 'Verplaatsen...' : 'Verplaatsen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { api } = useAuth()
  const [stats, setStats] = useState(null)
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | trainer object
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [error, setError] = useState('')
  const [expandedTrainer, setExpandedTrainer] = useState(null) // trainer id with expanded client list
  const [trainerClients, setTrainerClients] = useState({}) // { trainerId: [...clients] }
  const [reassignClient, setReassignClient] = useState(null) // client object to reassign

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, trainersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/trainers'),
      ])
      setStats(statsRes.data)
      setTrainers(trainersRes.data)
    } catch {
      setError('Kon data niet laden.')
    } finally {
      setLoading(false)
    }
  }

  function handleSaved(savedTrainer) {
    setTrainers(prev => {
      const idx = prev.findIndex(t => t.id === savedTrainer.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = savedTrainer
        return next
      }
      return [savedTrainer, ...prev]
    })
    setModal(null)
    loadData() // refresh stats too
  }

  async function toggleTrainerClients(trainerId) {
    if (expandedTrainer === trainerId) {
      setExpandedTrainer(null)
      return
    }
    setExpandedTrainer(trainerId)
    if (!trainerClients[trainerId]) {
      try {
        const res = await api.get(`/admin/trainers/${trainerId}`)
        setTrainerClients(prev => ({ ...prev, [trainerId]: res.data.clients }))
      } catch {
        setTrainerClients(prev => ({ ...prev, [trainerId]: [] }))
      }
    }
  }

  function handleReassigned(updatedClient) {
    // Verwijder klant uit de huidige trainer's lijst
    setTrainerClients(prev => {
      const updated = {}
      for (const tid in prev) {
        updated[tid] = prev[tid].filter(c => c.id !== updatedClient.id)
      }
      return updated
    })
    setReassignClient(null)
    loadData() // refresh trainer stats
  }

  async function handleDelete(trainer) {
    try {
      await api.delete(`/admin/trainers/${trainer.id}`)
      setTrainers(prev => prev.filter(t => t.id !== trainer.id))
      setDeleteConfirm(null)
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Verwijderen mislukt.')
      setDeleteConfirm(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: '#063854', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-700">Beheer</h1>
          <p className="text-dark-muted text-sm mt-1">Overzicht van alle trainers en platformstatistieken</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Trainer toevoegen
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Trainers" value={stats.trainers} icon={
            <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          } />
          <StatCard label="Actief" value={stats.active} icon={
            <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          } />
          <StatCard label="Klanten" value={stats.clients} icon={
            <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          } />
          <StatCard label="Sessies" value={stats.sessions} icon={
            <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          } />
          <StatCard label="Sets gelogd" value={stats.sets} icon={
            <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          } />
        </div>
      )}

      {/* Trainers — card list on mobile, table on desktop */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-surface-border">
          <h2 className="font-bold font-heading text-dark">Trainers</h2>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-surface-border">
          {trainers.length === 0 && (
            <p className="px-4 py-8 text-center text-dark-muted text-sm">Nog geen trainers gevonden.</p>
          )}
          {trainers.map(trainer => (
            <div key={trainer.id} className="px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold font-heading flex-shrink-0 text-white" style={{ backgroundColor: '#063854' }}>
                {trainer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold font-heading text-dark text-sm">{trainer.name}</span>
                  {trainer.is_admin && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-heading font-semibold bg-brand-100 text-brand-700">Admin</span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-heading font-semibold ${trainer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trainer.is_active ? 'Actief' : 'Inactief'}
                  </span>
                </div>
                <p className="text-xs text-dark-muted truncate mt-0.5">{trainer.email}</p>
                <p className="text-xs text-dark-subtle mt-0.5">{trainer.client_count} klanten · {trainer.session_count} sessies</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setModal(trainer)} className="icon-btn text-dark-subtle hover:text-brand-700" title="Bewerken">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {!trainer.is_admin && (
                  <button onClick={() => setDeleteConfirm(trainer)} className="icon-btn text-dark-subtle hover:text-red-600" title="Verwijderen">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface">
                <th className="text-left px-6 py-3 font-semibold font-heading text-dark-subtle uppercase tracking-wider text-xs">Naam</th>
                <th className="text-left px-6 py-3 font-semibold font-heading text-dark-subtle uppercase tracking-wider text-xs">E-mail</th>
                <th className="text-center px-4 py-3 font-semibold font-heading text-dark-subtle uppercase tracking-wider text-xs">Klanten</th>
                <th className="text-center px-4 py-3 font-semibold font-heading text-dark-subtle uppercase tracking-wider text-xs">Sessies</th>
                <th className="text-center px-4 py-3 font-semibold font-heading text-dark-subtle uppercase tracking-wider text-xs">Status</th>
                <th className="text-center px-4 py-3 font-semibold font-heading text-dark-subtle uppercase tracking-wider text-xs">Rol</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {trainers.map(trainer => (
                <React.Fragment key={trainer.id}>
                  <tr className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-heading flex-shrink-0 text-white" style={{ backgroundColor: '#063854' }}>
                          {trainer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium text-dark">{trainer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-muted">{trainer.email}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleTrainerClients(trainer.id)}
                        className="text-brand-700 font-semibold hover:underline"
                        title="Klik om klanten te zien"
                      >
                        {trainer.client_count}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center text-dark">{trainer.session_count}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-heading ${trainer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {trainer.is_active ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {trainer.is_admin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-heading bg-brand-100 text-brand-700">Admin</span>
                      ) : (
                        <span className="text-dark-subtle text-xs">Trainer</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(trainer)} className="icon-btn text-dark-subtle hover:text-brand-700 transition-colors" title="Bewerken">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {!trainer.is_admin && (
                          <button onClick={() => setDeleteConfirm(trainer)} className="icon-btn text-dark-subtle hover:text-red-600 transition-colors" title="Verwijderen">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Uitklapbare clientenlijst */}
                  {expandedTrainer === trainer.id && (
                    <tr>
                      <td colSpan={7} className="px-6 pb-4 pt-0" style={{ backgroundColor: 'rgba(6,56,84,0.02)' }}>
                        {!trainerClients[trainer.id] ? (
                          <p className="text-xs text-dark-muted py-2">Laden...</p>
                        ) : trainerClients[trainer.id].length === 0 ? (
                          <p className="text-xs text-dark-muted py-2">Geen klanten.</p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            {trainerClients[trainer.id].map(client => (
                              <div key={client.id} className="flex items-center justify-between py-1.5 px-3 rounded" style={{ backgroundColor: 'rgba(6,56,84,0.04)' }}>
                                <span className="text-sm text-dark">{client.name}</span>
                                <button
                                  onClick={() => setReassignClient({ ...client, trainer_id: trainer.id })}
                                  className="text-xs text-brand-700 hover:underline font-medium"
                                >
                                  Verplaatsen
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {trainers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-dark-muted">Nog geen trainers gevonden.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit modal */}
      {modal && (
        <TrainerModal
          trainer={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSaved}
        />
      )}

      {/* Reassign modal */}
      {reassignClient && (
        <ReassignModal
          client={reassignClient}
          trainers={trainers}
          onClose={() => setReassignClient(null)}
          onSaved={handleReassigned}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold font-heading text-dark text-lg mb-2">Trainer verwijderen?</h3>
            <p className="text-dark-muted text-sm mb-6">
              Weet je zeker dat je <strong>{deleteConfirm.name}</strong> wil verwijderen? Alle gekoppelde klanten en workouts worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-surface-border rounded font-heading font-semibold text-sm text-dark hover:bg-surface transition-colors uppercase tracking-wider">
                Annuleren
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded font-heading font-semibold text-sm uppercase tracking-wider transition-colors">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
