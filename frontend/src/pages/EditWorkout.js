import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ExerciseSearch from '../components/ExerciseSearch'
import SetRow from '../components/SetRow'

function ExerciseCard({ we, exIdx, onAddSet, onRemoveSet, onUpdateSet, onRemoveExercise }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-dark">{we.exercise.name}</h3>
          <p className="text-xs text-dark-subtle">{we.exercise.muscle_group}{we.exercise.equipment ? ` · ${we.exercise.equipment}` : ''}</p>
        </div>
        <button onClick={() => onRemoveExercise(exIdx)} className="icon-btn text-dark-subtle hover:text-red-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
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

export default function EditWorkout() {
  const { api } = useAuth()
  const navigate = useNavigate()
  const { sessionId } = useParams()

  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState(null)
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState([]) // all exercises for search
  const [workoutExercises, setWorkoutExercises] = useState([])
  const [addingExercise, setAddingExercise] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/workouts/sessions/${sessionId}`),
      api.get('/exercises'),
    ]).then(([sessionRes, exercisesRes]) => {
      const session = sessionRes.data
      setClientId(session.client_id)
      setDate(session.date)
      setNotes(session.notes || '')

      // Group sets by exercise_id to rebuild workoutExercises structure
      const exerciseMap = {}
      for (const set of session.sets || []) {
        if (!exerciseMap[set.exercise_id]) {
          exerciseMap[set.exercise_id] = {
            exercise: {
              id: set.exercise_id,
              name: set.exercise_name,
              muscle_group: set.muscle_group,
              equipment: set.equipment || null,
            },
            sets: [],
          }
        }
        exerciseMap[set.exercise_id].sets.push({
          reps: set.reps ?? null,
          weight_kg: set.weight_kg ?? null,
          rpe: set.rpe || null,
        })
      }
      setWorkoutExercises(Object.values(exerciseMap))
      setExercises(exercisesRes.data)
    }).catch(() => {
      setError('Workout niet gevonden')
    }).finally(() => setLoading(false))
  }, [api, sessionId])

  function addSet(exIdx) {
    const updated = [...workoutExercises]
    updated[exIdx].sets.push({ ...updated[exIdx].sets[updated[exIdx].sets.length - 1] })
    setWorkoutExercises(updated)
  }
  function removeSet(exIdx, setIdx) {
    const updated = [...workoutExercises]
    updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx)
    setWorkoutExercises(updated)
  }
  function updateSet(exIdx, setIdx, values) {
    const updated = [...workoutExercises]
    updated[exIdx].sets[setIdx] = values
    setWorkoutExercises(updated)
  }
  function removeExercise(exIdx) {
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== exIdx))
  }
  function addExercise(exercise) {
    if (workoutExercises.some(we => we.exercise.id === exercise.id)) {
      setError(`${exercise.name} is al toegevoegd`)
      setTimeout(() => setError(''), 3000)
      setAddingExercise(false)
      return
    }
    setWorkoutExercises(prev => [...prev, { exercise, sets: [{ reps: null, weight_kg: null, rpe: null }] }])
    setAddingExercise(false)
  }

  async function handleSave() {
    if (workoutExercises.length === 0) { setError('Voeg minimaal 1 oefening toe'); return }
    setSaving(true)
    setError('')
    try {
      await api.put(`/workouts/sessions/${sessionId}`, { date, notes: notes || undefined })

      const setsPayload = workoutExercises.flatMap(({ exercise, sets }) =>
        sets.map((set, idx) => ({
          exercise_id: exercise.id,
          set_number: idx + 1,
          reps: set.reps ?? 0,
          weight_kg: set.weight_kg ?? 0,
          rpe: set.rpe || null,
        }))
      )
      await api.put(`/workouts/sessions/${sessionId}/sets`, setsPayload)

      navigate(`/clients/${clientId}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div></div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-brand-700">Workout bewerken</h1>
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
            <label className="label">Datum *</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notities (optioneel)</label>
            <input className="input" placeholder="Bijv. deload week, PR poging, ..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4 mb-4">
        {workoutExercises.map((we, exIdx) => (
          <ExerciseCard
            key={exIdx}
            we={we}
            exIdx={exIdx}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            onUpdateSet={updateSet}
            onRemoveExercise={removeExercise}
          />
        ))}
      </div>

      <button
        onClick={() => setAddingExercise(true)}
        className="w-full border-2 border-dashed border-surface-border rounded-xl py-4 text-dark-muted hover:border-brand-400 hover:text-brand-500 transition-colors flex items-center justify-center gap-2 mb-6"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Oefening toevoegen
      </button>

      {/* Save bar */}
      <div className="card bg-surface-hover border-brand-400">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-dark-muted">
            <span className="font-semibold">{workoutExercises.length}</span> oefeningen ·{' '}
            <span className="font-semibold">{workoutExercises.reduce((acc, we) => acc + we.sets.length, 0)}</span> sets
          </p>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-shrink-0">
            {saving ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </button>
        </div>
      </div>

      {addingExercise && (
        <ExerciseSearch
          exercises={exercises}
          onSelect={addExercise}
          onClose={() => setAddingExercise(false)}
        />
      )}
    </div>
  )
}
