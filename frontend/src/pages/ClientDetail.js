import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import WorkoutCard from '../components/WorkoutCard'

function calculateAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
const DAY_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
// Display order: Ma t/m Zo (1,2,3,4,5,6,0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function DuoEditor({ clientId, client, api, onPartnerChange }) {
  const [allClients, setAllClients] = useState(null)
  const [partner, setPartner] = useState(
    client.duo_partner_id ? { id: client.duo_partner_id, name: client.duo_partner_name } : null
  )
  const [linking, setLinking] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (linking && allClients === null) {
      api.get('/clients').then(r => setAllClients(r.data)).catch(() => setAllClients([]))
    }
  }, [linking, allClients, api])

  async function handleLink(partnerId) {
    setSaving(true)
    try {
      const res = await api.put(`/clients/${clientId}/duo`, { partner_id: partnerId })
      setPartner(res.data.partner)
      onPartnerChange(res.data.partner)
      setLinking(false)
      setSearch('')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnlink() {
    if (!window.confirm(`Weet je zeker dat je de duo met ${partner.name} wilt ontkoppelen?`)) return
    setSaving(true)
    try {
      await api.delete(`/clients/${clientId}/duo`)
      setPartner(null)
      onPartnerChange(null)
    } finally {
      setSaving(false)
    }
  }

  // Filter out self and current partner from list
  const filteredClients = (allClients || []).filter(c =>
    c.id !== parseInt(clientId) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold font-heading text-dark text-sm uppercase tracking-wider flex items-center gap-2">
          <span>🤝</span> Duo
        </h3>
        {saving && <span className="text-xs text-dark-muted">Opslaan...</span>}
      </div>

      {partner ? (
        <div className="flex items-center justify-between bg-brand-50 rounded-xl p-3 border border-brand-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {partner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-dark-muted font-medium uppercase tracking-wide">Duo met</p>
              <p className="font-semibold text-dark">{partner.name}</p>
            </div>
          </div>
          <button onClick={handleUnlink} disabled={saving} className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors min-h-[36px]">
            Ontkoppelen
          </button>
        </div>
      ) : (
        <>
          {!linking ? (
            <button
              onClick={() => setLinking(true)}
              className="w-full border-2 border-dashed border-surface-border rounded-xl py-3 text-dark-muted hover:border-brand-400 hover:text-brand-500 transition-colors flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Duo koppelen
            </button>
          ) : (
            <div>
              <input
                autoFocus
                className="input mb-2"
                placeholder="Zoek klant..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {allClients === null ? (
                  <p className="text-sm text-dark-muted text-center py-2">Laden...</p>
                ) : filteredClients.length === 0 ? (
                  <p className="text-sm text-dark-muted text-center py-2">Geen klanten gevonden</p>
                ) : (
                  filteredClients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleLink(c.id)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover text-left transition-colors min-h-[44px]"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-dark">{c.name}</span>
                      {c.duo_partner_id && c.duo_partner_id !== parseInt(clientId) && (
                        <span className="text-xs text-dark-muted ml-auto">heeft al duo</span>
                      )}
                    </button>
                  ))
                )}
              </div>
              <button onClick={() => { setLinking(false); setSearch('') }} className="mt-2 text-sm text-dark-muted hover:text-dark">
                Annuleren
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ScheduleEditor({ clientId, api }) {
  // schedule: [{ day_of_week, start_time }]
  const [schedule, setSchedule] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/clients/${clientId}/schedule`)
      .then(r => setSchedule(r.data))
      .catch(() => setSchedule([]))
  }, [clientId, api])

  async function save(next) {
    setSaving(true)
    try {
      await api.put(`/clients/${clientId}/schedule`, { days: next })
    } finally {
      setSaving(false)
    }
  }

  function getEntry(day) {
    return schedule?.find(e => e.day_of_week === day) || null
  }

  async function toggleDay(day) {
    const current = schedule || []
    const exists = current.some(e => e.day_of_week === day)
    const next = exists
      ? current.filter(e => e.day_of_week !== day)
      : [...current, { day_of_week: day, start_time: null }].sort((a, b) => a.day_of_week - b.day_of_week)
    setSchedule(next)
    await save(next)
  }

  async function updateTime(day, time) {
    const current = schedule || []
    const next = current.map(e => e.day_of_week === day ? { ...e, start_time: time || null } : e)
    setSchedule(next)
    await save(next)
  }

  if (schedule === null) return <div className="text-sm text-dark-muted">Laden...</div>

  const activeDays = DAY_ORDER.filter(day => schedule.some(e => e.day_of_week === day))

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold font-heading text-dark text-sm uppercase tracking-wider">Trainingsrooster</h3>
        {saving && <span className="text-xs text-dark-muted">Opslaan...</span>}
      </div>

      {/* Day toggle buttons */}
      <div className="flex gap-2 flex-wrap mb-4">
        {DAY_ORDER.map(day => {
          const active = schedule.some(e => e.day_of_week === day)
          return (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              title={DAY_FULL[day]}
              className={`w-11 h-11 rounded-full text-sm font-bold font-heading transition-all border-2 ${
                active
                  ? 'text-white border-brand-700'
                  : 'text-dark-muted border-surface-border hover:border-brand-400 bg-white'
              }`}
              style={active ? { backgroundColor: '#063854', borderColor: '#063854' } : {}}
            >
              {DAYS[day]}
            </button>
          )
        })}
      </div>

      {/* Time inputs per active day */}
      {activeDays.length > 0 && (
        <div className="space-y-2">
          {activeDays.map(day => {
            const entry = getEntry(day)
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-8 text-xs font-bold text-brand-700 font-heading flex-shrink-0">{DAYS[day]}</span>
                <input
                  type="time"
                  className="input py-1.5 text-sm w-32 flex-shrink-0"
                  value={entry?.start_time || ''}
                  onChange={e => updateTime(day, e.target.value)}
                  placeholder="--:--"
                />
                {entry?.start_time && (
                  <span className="text-xs text-dark-muted">{DAY_FULL[day]}</span>
                )}
              </div>
            )
          })}
          <p className="text-xs text-dark-muted pt-1">
            {activeDays.length}x per week
            {activeDays.some(d => getEntry(d)?.start_time) && (
              <> · {activeDays
                .filter(d => getEntry(d)?.start_time)
                .map(d => `${DAYS[d]} ${getEntry(d).start_time}`)
                .join(', ')}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const { api } = useAuth()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [duoPartner, setDuoPartner] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/sessions`),
    ]).then(([c, s]) => {
      setClient(c.data)
      setEditForm({ name: c.data.name, email: c.data.email || '', birth_date: c.data.birth_date || '', notes: c.data.notes || '' })
      setSessions(s.data)
      if (c.data.duo_partner_id) {
        setDuoPartner({ id: c.data.duo_partner_id, name: c.data.duo_partner_name })
      }
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id, api, navigate])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put(`/clients/${id}`, editForm)
      setClient(res.data)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!window.confirm('Weet je zeker dat je deze workout wilt verwijderen?')) return
    await api.delete(`/workouts/sessions/${sessionId}`)
    setSessions(sessions.filter(s => s.id !== sessionId))
  }

  async function handleDeleteClient() {
    if (!window.confirm(`Weet je zeker dat je ${client.name} en alle workouts wilt verwijderen?`)) return
    await api.delete(`/clients/${id}`)
    navigate('/')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div></div>
  }

  if (!client) return null

  const age = calculateAge(client.birth_date)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-dark-muted hover:text-dark mb-6 -ml-1 py-2 pr-3 min-h-[44px]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Terug
      </button>

      {/* Client info */}
      <div className="card mb-6">
        {editing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Naam *</label>
              <input required className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Geboortedatum</label>
              <input type="date" className="input" value={editForm.birth_date} onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Notities</label>
              <input className="input" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Opslaan...' : 'Opslaan'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Annuleren</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold font-heading text-brand-700">{client.name}</h1>
                {age !== null && <p className="text-dark-muted">{age} jaar</p>}
                {client.email && <p className="text-sm text-dark-muted truncate">{client.email}</p>}
                {client.notes && <p className="text-sm text-dark-subtle mt-2 italic">{client.notes}</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditing(true)} className="btn-secondary text-xs flex-1 sm:flex-none">Bewerken</button>
              <button onClick={handleDeleteClient} className="btn-danger text-xs flex-1 sm:flex-none">Verwijderen</button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="card mb-6">
        <ScheduleEditor clientId={id} api={api} />
      </div>

      {/* Duo */}
      <div className="card mb-6">
        <DuoEditor
          clientId={id}
          client={client}
          api={api}
          onPartnerChange={setDuoPartner}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => navigate(`/log-workout?clientId=${id}${duoPartner ? `&duoPartnerId=${duoPartner.id}` : ''}`)}
          className="btn-primary"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log workout
        </button>
        <button onClick={() => navigate(`/progress/${id}`)} className="btn-secondary">
          📈 Voortgang
        </button>
      </div>

      {/* Workout history */}
      <h2 className="text-lg font-semibold font-heading text-brand-700 mb-4">
        Workout history ({sessions.length})
      </h2>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-dark-subtle">
          <div className="text-4xl mb-2">🏋️</div>
          <p>Nog geen workouts gelogd voor {client.name}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <WorkoutCard
              key={session.id}
              session={session}
              clientId={id}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      )}
    </div>
  )
}
