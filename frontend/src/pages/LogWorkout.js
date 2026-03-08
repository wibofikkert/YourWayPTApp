import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ExerciseSearch from '../components/ExerciseSearch'
import SetRow from '../components/SetRow'

const DEFAULT_SET = { reps: '', weight_kg: '', rpe: null }

// Format days-ago label from a date string
function daysAgoLabel(dateStr) {
  if (!dateStr) return null
  const then = new Date(dateStr)
  const now = new Date()
  const diffMs = now.setHours(0, 0, 0, 0) - then.setHours(0, 0, 0, 0)
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (days === 0) return 'vandaag'
  if (days === 1) return 'gisteren'
  if (days < 7) return `${days}d geleden`
  if (days < 30) return `${Math.round(days / 7)}w geleden`
  return `${Math.round(days / 30)}mnd geleden`
}

// Format last-session data into a readable hint string
function formatHint(lastData) {
  if (!lastData || !lastData.sets || lastData.sets.length === 0) return null
  const { date, sets } = lastData
  const count = sets.length
  const reps = sets[0].reps
  const maxWeight = Math.max(...sets.map(s => s.weight_kg))
  const ago = daysAgoLabel(date)
  const weightPart = maxWeight > 0 ? ` @ ${maxWeight} kg` : ''
  return `${count}×${reps}${weightPart}${ago ? ` · ${ago}` : ''}`
}

// Build initial sets from last session (auto-fill), or use default
function initialSets(lastData) {
  const sets = lastData?.sets
  if (!sets || sets.length === 0) return [{ ...DEFAULT_SET }]
  return sets.map(s => ({ reps: s.reps, weight_kg: s.weight_kg, rpe: s.rpe || null }))
}

// Single exercise card used in both single-mode and panels
function ExerciseCard({ we, exIdx, clientId, lastSessions, onAddSet, onRemoveSet, onUpdateSet, onRemoveExercise, large = false }) {
  const key = clientId ? `${clientId}_${we.exercise.id}` : null
  const hint = key ? formatHint(lastSessions[key]) : null
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className={`font-semibold text-dark ${large ? '' : 'text-sm'}`}>{we.exercise.name}</h3>
          <p className="text-xs text-dark-subtle">{we.exercise.muscle_group}{we.exercise.equipment ? ` · ${we.exercise.equipment}` : ''}</p>
        </div>
        <button onClick={() => onRemoveExercise(exIdx)} className="icon-btn text-dark-subtle hover:text-red-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {hint && (
        <p className="text-xs text-brand-500 font-medium mb-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {hint}
        </p>
      )}
      <div className="space-y-2">
        {we.sets.map((set, setIdx) => (
          <SetRow
            key={setIdx}
            setNumber={setIdx + 1}
            values={set}
            onChange={values => onUpdateSet(exIdx, setIdx, values)}
            onRemove={() => onRemoveSet(exIdx, setIdx)}
            canRemove={we.sets.length > 1}
          />
        ))}
      </div>
      <button
        onClick={() => onAddSet(exIdx)}
        className="mt-2 text-sm text-brand-500 hover:text-brand-700 font-medium flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Set toevoegen
      </button>
    </div>
  )
}

// One client's exercise panel content (used inside DuoPanels)
function ExercisePanel({ client, exercises, lastSessions, onAddSet, onRemoveSet, onUpdateSet, onRemoveExercise, onAddExercise }) {
  if (!client) return null
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 flex-1">
        {exercises.map((we, exIdx) => (
          <ExerciseCard
            key={exIdx}
            we={we}
            exIdx={exIdx}
            clientId={client.id}
            lastSessions={lastSessions}
            onAddSet={onAddSet}
            onRemoveSet={onRemoveSet}
            onUpdateSet={onUpdateSet}
            onRemoveExercise={onRemoveExercise}
          />
        ))}
      </div>
      <button
        onClick={onAddExercise}
        className="mt-3 w-full border-2 border-dashed border-surface-border rounded-xl py-3 text-dark-muted hover:border-brand-400 hover:text-brand-500 transition-colors flex items-center justify-center gap-2 text-sm min-h-[44px]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Oefening toevoegen
      </button>
    </div>
  )
}

// Duo panels: swipeable on mobile, side-by-side on desktop
function DuoPanels({
  selectedClient, duoPartner,
  primaryExercises, duoExercises,
  lastSessions,
  onPrimaryAddSet, onPrimaryRemoveSet, onPrimaryUpdateSet, onPrimaryRemoveExercise, onPrimaryAddExercise,
  onDuoAddSet, onDuoRemoveSet, onDuoUpdateSet, onDuoRemoveExercise, onDuoAddExercise,
}) {
  const [activeTab, setActiveTab] = useState(0) // 0 = primary, 1 = duo
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Only trigger on primarily horizontal swipes (more horizontal than vertical)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0 && activeTab === 0) setActiveTab(1)   // swipe left → duo
      if (dx > 0 && activeTab === 1) setActiveTab(0)   // swipe right → primary
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const primaryName = selectedClient?.name || 'Klant 1'
  const duoName = duoPartner?.name || 'Klant 2'

  return (
    <div className="mb-6">
      {/* Tab bar — only visible on mobile (lg: hidden) */}
      <div className="flex lg:hidden mb-3 rounded-xl overflow-hidden border border-surface-border bg-surface-hover">
        {[primaryName, duoName].map((name, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === idx
                ? 'bg-brand-700 text-white'
                : 'text-dark-muted hover:text-dark'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              activeTab === idx ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
            }`}>
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{name}</span>
            {/* Exercise count badge */}
            {(idx === 0 ? primaryExercises : duoExercises).length > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${
                activeTab === idx ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
              }`}>
                {(idx === 0 ? primaryExercises : duoExercises).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Swipe hint — only shown when no exercises yet on mobile */}
      {primaryExercises.length === 0 && duoExercises.length === 0 && (
        <p className="lg:hidden text-xs text-center text-dark-muted mb-3">
          ← Veeg om te wisselen →
        </p>
      )}

      {/* Mobile: single panel with swipe */}
      <div
        className="lg:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 0 ? (
          <ExercisePanel
            client={selectedClient}
            exercises={primaryExercises}
            lastSessions={lastSessions}
            onAddSet={onPrimaryAddSet}
            onRemoveSet={onPrimaryRemoveSet}
            onUpdateSet={onPrimaryUpdateSet}
            onRemoveExercise={onPrimaryRemoveExercise}
            onAddExercise={onPrimaryAddExercise}
          />
        ) : (
          <ExercisePanel
            client={duoPartner}
            exercises={duoExercises}
            lastSessions={lastSessions}
            onAddSet={onDuoAddSet}
            onRemoveSet={onDuoRemoveSet}
            onUpdateSet={onDuoUpdateSet}
            onRemoveExercise={onDuoRemoveExercise}
            onAddExercise={onDuoAddExercise}
          />
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-4">
        <div>
          {/* Desktop client header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {primaryName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-dark">{primaryName}</span>
          </div>
          <ExercisePanel
            client={selectedClient}
            exercises={primaryExercises}
            lastSessions={lastSessions}
            onAddSet={onPrimaryAddSet}
            onRemoveSet={onPrimaryRemoveSet}
            onUpdateSet={onPrimaryUpdateSet}
            onRemoveExercise={onPrimaryRemoveExercise}
            onAddExercise={onPrimaryAddExercise}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {duoName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-dark">{duoName}</span>
          </div>
          <ExercisePanel
            client={duoPartner}
            exercises={duoExercises}
            lastSessions={lastSessions}
            onAddSet={onDuoAddSet}
            onRemoveSet={onDuoRemoveSet}
            onUpdateSet={onDuoUpdateSet}
            onRemoveExercise={onDuoRemoveExercise}
            onAddExercise={onDuoAddExercise}
          />
        </div>
      </div>
    </div>
  )
}

export default function LogWorkout() {
  const { api } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [clients, setClients] = useState([])
  const [exercises, setExercises] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [duoPartner, setDuoPartner] = useState(null)
  const [logForDuo, setLogForDuo] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const [primaryExercises, setPrimaryExercises] = useState([])
  const [duoExercises, setDuoExercises] = useState([])
  const [lastSessions, setLastSessions] = useState({})
  const [addingExerciseFor, setAddingExerciseFor] = useState(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const presetClientId = searchParams.get('clientId')
  const presetDuoPartnerId = searchParams.get('duoPartnerId')
  const editSessionId = searchParams.get('editSession')
  const isEditMode = !!editSessionId

  useEffect(() => {
    const sessionFetch = editSessionId
      ? api.get(`/workouts/sessions/${editSessionId}`)
      : Promise.resolve(null)

    Promise.all([api.get('/clients'), api.get('/exercises'), sessionFetch])
      .then(async ([c, e, sessionRes]) => {
        const clientList = c.data
        const exerciseList = e.data
        setClients(clientList)
        setExercises(exerciseList)

        if (sessionRes) {
          // Edit mode: pre-fill from existing session
          const session = sessionRes.data
          let client = clientList.find(cl => cl.id === session.client_id)
          if (!client) {
            try {
              const r = await api.get(`/clients/${session.client_id}`)
              client = r.data
              setClients(prev => [...prev, r.data])
            } catch { /* negeer */ }
          }
          if (client) setSelectedClient(client)
          setDate(session.date)
          setNotes(session.notes || '')
          // Group sets by exercise_id to rebuild primaryExercises
          const byExercise = {}
          for (const s of (session.sets || [])) {
            if (!byExercise[s.exercise_id]) {
              byExercise[s.exercise_id] = {
                exercise: exerciseList.find(ex => ex.id === s.exercise_id) || {
                  id: s.exercise_id, name: s.exercise_name, muscle_group: s.muscle_group, equipment: ''
                },
                sets: []
              }
            }
            byExercise[s.exercise_id].sets.push({ reps: s.reps, weight_kg: s.weight_kg, rpe: s.rpe || null })
          }
          setPrimaryExercises(Object.values(byExercise))
        } else {
          // New workout mode
          if (presetClientId) {
            let client = clientList.find(cl => cl.id === parseInt(presetClientId))
            if (!client) {
              try {
                const r = await api.get(`/clients/${presetClientId}`)
                client = r.data
                setClients(prev => [...prev, r.data])
              } catch { /* negeer */ }
            }
            if (client) setSelectedClient(client)
          }
          if (presetDuoPartnerId) {
            const partner = clientList.find(cl => cl.id === parseInt(presetDuoPartnerId))
            if (partner) {
              setDuoPartner(partner)
              setLogForDuo(true)
            }
          }
        }
      })
  }, [api, presetClientId, presetDuoPartnerId, editSessionId])

  const fetchLastSession = useCallback(async (clientId, exerciseId) => {
    const key = `${clientId}_${exerciseId}`
    try {
      const res = await api.get(`/workouts/last-session/${clientId}/${exerciseId}`)
      setLastSessions(prev => ({ ...prev, [key]: res.data }))
      return res.data
    } catch {
      const empty = { date: null, sets: [] }
      setLastSessions(prev => ({ ...prev, [key]: empty }))
      return empty
    }
  }, [api])

  async function addExercise(exercise) {
    if (addingExerciseFor === 'primary' || !logForDuo) {
      if (primaryExercises.some(we => we.exercise.id === exercise.id)) {
        setError(`${exercise.name} is al toegevoegd`)
        setTimeout(() => setError(''), 3000)
        setAddingExerciseFor(null)
        return
      }
      const lastData = selectedClient ? await fetchLastSession(selectedClient.id, exercise.id) : null
      setPrimaryExercises(prev => [...prev, { exercise, sets: initialSets(lastData) }])
    } else {
      if (duoExercises.some(we => we.exercise.id === exercise.id)) {
        setError(`${exercise.name} is al toegevoegd`)
        setTimeout(() => setError(''), 3000)
        setAddingExerciseFor(null)
        return
      }
      const lastData = duoPartner ? await fetchLastSession(duoPartner.id, exercise.id) : null
      setDuoExercises(prev => [...prev, { exercise, sets: initialSets(lastData) }])
    }
    setAddingExerciseFor(null)
  }

  // Primary panel handlers
  function primaryAddSet(exIdx) {
    const updated = [...primaryExercises]
    updated[exIdx].sets.push({ ...updated[exIdx].sets[updated[exIdx].sets.length - 1] })
    setPrimaryExercises(updated)
  }
  function primaryRemoveSet(exIdx, setIdx) {
    const updated = [...primaryExercises]
    updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx)
    setPrimaryExercises(updated)
  }
  function primaryUpdateSet(exIdx, setIdx, values) {
    const updated = [...primaryExercises]
    updated[exIdx].sets[setIdx] = values
    setPrimaryExercises(updated)
  }
  function primaryRemoveExercise(exIdx) {
    setPrimaryExercises(primaryExercises.filter((_, i) => i !== exIdx))
  }

  // Duo panel handlers
  function duoAddSet(exIdx) {
    const updated = [...duoExercises]
    updated[exIdx].sets.push({ ...updated[exIdx].sets[updated[exIdx].sets.length - 1] })
    setDuoExercises(updated)
  }
  function duoRemoveSet(exIdx, setIdx) {
    const updated = [...duoExercises]
    updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx)
    setDuoExercises(updated)
  }
  function duoUpdateSet(exIdx, setIdx, values) {
    const updated = [...duoExercises]
    updated[exIdx].sets[setIdx] = values
    setDuoExercises(updated)
  }
  function duoRemoveExercise(exIdx) {
    setDuoExercises(duoExercises.filter((_, i) => i !== exIdx))
  }

  function buildSetsPayload(exList) {
    return exList.flatMap(({ exercise, sets }) =>
      sets.map((set, idx) => ({
        exercise_id: exercise.id,
        set_number: idx + 1,
        reps: set.reps === '' || set.reps === null || set.reps === undefined ? 0 : Number(set.reps),
        weight_kg: set.weight_kg === '' || set.weight_kg === null || set.weight_kg === undefined ? 0 : Number(set.weight_kg),
        rpe: set.rpe || null,
      }))
    )
  }

  async function handleSave() {
    if (!selectedClient) { setError('Selecteer een klant'); return }
    if (primaryExercises.length === 0) { setError('Voeg minimaal 1 oefening toe'); return }

    setSaving(true)
    setError('')
    try {
      if (isEditMode) {
        // Edit: update session metadata, replace all sets
        await api.put(`/workouts/sessions/${editSessionId}`, { date, notes: notes || undefined })
        await api.delete(`/workouts/sessions/${editSessionId}/sets`)
        await api.post(`/workouts/sessions/${editSessionId}/sets`, buildSetsPayload(primaryExercises))
      } else {
        // New workout
        const sessionRes = await api.post('/workouts/sessions', {
          client_id: selectedClient.id,
          date,
          notes: notes || undefined,
        })
        await api.post(`/workouts/sessions/${sessionRes.data.id}/sets`, buildSetsPayload(primaryExercises))

        if (logForDuo && duoPartner && duoExercises.length > 0) {
          const duoSessionRes = await api.post('/workouts/sessions', {
            client_id: duoPartner.id,
            date,
            notes: notes || undefined,
          })
          await api.post(`/workouts/sessions/${duoSessionRes.data.id}/sets`, buildSetsPayload(duoExercises))
        }
      }

      navigate(`/clients/${selectedClient.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const primarySets = primaryExercises.reduce((acc, we) => acc + we.sets.length, 0)
  const duoSets = duoExercises.reduce((acc, we) => acc + we.sets.length, 0)
  const canSave = primaryExercises.length > 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-brand-700">
          {isEditMode ? 'Workout aanpassen' : 'Workout loggen'}
        </h1>
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Annuleren</button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Session info */}
      <div className="card mb-6">
        <h2 className="font-semibold text-dark mb-4">Sessie info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Klant *</label>
            {isEditMode ? (
              <div className="input bg-surface-hover text-dark-muted cursor-default">
                {selectedClient?.name || '…'}
              </div>
            ) : (
              <select
                className="input"
                value={selectedClient?.id || ''}
                onChange={e => {
                  const c = clients.find(cl => cl.id === parseInt(e.target.value))
                  setSelectedClient(c || null)
                  setPrimaryExercises([])
                  setDuoExercises([])
                  if (c && c.duo_partner_id) {
                    const partner = clients.find(cl => cl.id === c.duo_partner_id)
                    setDuoPartner(partner || null)
                    setLogForDuo(!!partner)
                  } else {
                    setDuoPartner(null)
                    setLogForDuo(false)
                  }
                }}
              >
                <option value="">Selecteer klant...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Datum *</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notities (optioneel)</label>
            <input className="input" placeholder="Bijv. deload week, PR poging, ..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Duo toggle — alleen bij nieuwe workout */}
        {!isEditMode && duoPartner && (
          <div className="mt-4 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => setLogForDuo(!logForDuo)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                logForDuo
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-surface-border bg-white hover:border-brand-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                logForDuo ? 'border-brand-700 bg-brand-700' : 'border-dark-muted'
              }`}>
                {logForDuo && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🤝</span>
                <div className="min-w-0">
                  <p className="font-semibold text-dark text-sm">Duo-sessie met {duoPartner.name}</p>
                  <p className="text-xs text-dark-muted">Elk zijn eigen oefeningen en gewichten</p>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Exercise panels */}
      {!isEditMode && logForDuo && duoPartner ? (
        <DuoPanels
          selectedClient={selectedClient}
          duoPartner={duoPartner}
          primaryExercises={primaryExercises}
          duoExercises={duoExercises}
          lastSessions={lastSessions}
          onPrimaryAddSet={primaryAddSet}
          onPrimaryRemoveSet={primaryRemoveSet}
          onPrimaryUpdateSet={primaryUpdateSet}
          onPrimaryRemoveExercise={primaryRemoveExercise}
          onPrimaryAddExercise={() => setAddingExerciseFor('primary')}
          onDuoAddSet={duoAddSet}
          onDuoRemoveSet={duoRemoveSet}
          onDuoUpdateSet={duoUpdateSet}
          onDuoRemoveExercise={duoRemoveExercise}
          onDuoAddExercise={() => setAddingExerciseFor('duo')}
        />
      ) : (
        /* SINGLE MODE */
        <div className="mb-6">
          <div className="space-y-4 mb-4">
            {primaryExercises.map((we, exIdx) => (
              <ExerciseCard
                key={exIdx}
                we={we}
                exIdx={exIdx}
                clientId={selectedClient?.id}
                lastSessions={lastSessions}
                onAddSet={primaryAddSet}
                onRemoveSet={primaryRemoveSet}
                onUpdateSet={primaryUpdateSet}
                onRemoveExercise={primaryRemoveExercise}
                large
              />
            ))}
          </div>
          <button
            onClick={() => setAddingExerciseFor('primary')}
            className="w-full border-2 border-dashed border-surface-border rounded-xl py-4 text-dark-muted hover:border-brand-400 hover:text-brand-500 transition-colors flex items-center justify-center gap-2 mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Oefening toevoegen
          </button>
        </div>
      )}

      {/* Save bar */}
      {canSave && (
        <div className="card bg-surface-hover border-brand-400">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-dark-muted min-w-0">
              {logForDuo && duoPartner ? (
                <>
                  <p><span className="font-semibold">{selectedClient?.name}</span>: {primaryExercises.length} oef · {primarySets} sets</p>
                  <p className="mt-0.5"><span className="font-semibold">{duoPartner.name}</span>: {duoExercises.length} oef · {duoSets} sets</p>
                </>
              ) : (
                <p><span className="font-semibold">{primaryExercises.length}</span> oefeningen · <span className="font-semibold">{primarySets}</span> sets</p>
              )}
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-shrink-0">
              {saving ? 'Opslaan...' : isEditMode ? 'Aanpassingen opslaan' : (!isEditMode && logForDuo && duoPartner ? 'Duo opslaan' : 'Workout opslaan')}
            </button>
          </div>
        </div>
      )}

      {/* Exercise search modal */}
      {addingExerciseFor && (
        <ExerciseSearch
          exercises={exercises}
          onSelect={addExercise}
          onClose={() => setAddingExerciseFor(null)}
        />
      )}
    </div>
  )
}
