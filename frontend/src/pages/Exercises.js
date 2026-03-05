import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { MUSCLE_COLORS } from '../components/ExerciseSearch'

export default function Exercises() {
  const { api } = useAuth()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMuscle, setSelectedMuscle] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ name: '', muscle_group: '', secondary_muscles: '', equipment: '', instructions: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/exercises')
      .then(res => setExercises(res.data))
      .finally(() => setLoading(false))
  }, [api])

  const muscleGroups = useMemo(() => {
    return [...new Set(exercises.map(e => e.muscle_group))].sort()
  }, [exercises])

  const filtered = useMemo(() => {
    return exercises.filter(e => {
      const matchesMuscle = !selectedMuscle || e.muscle_group === selectedMuscle
      const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase())
      return matchesMuscle && matchesSearch
    })
  }, [exercises, selectedMuscle, search])

  async function handleAddExercise(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/exercises', form)
      setExercises([...exercises, res.data])
      setForm({ name: '', muscle_group: '', secondary_muscles: '', equipment: '', instructions: '' })
      setShowAddForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Verwijder deze aangepaste oefening?')) return
    await api.delete(`/exercises/${id}`)
    setExercises(exercises.filter(e => e.id !== id))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-brand-700">Oefeningen database</h1>
          <p className="text-dark-muted mt-1">{exercises.length} oefeningen beschikbaar</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Eigen oefening
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card mb-6 border-brand-400">
          <h3 className="font-semibold text-dark mb-4">Aangepaste oefening toevoegen</h3>
          <form onSubmit={handleAddExercise} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Naam *</label>
              <input required className="input" placeholder="Naam van de oefening" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Spiergroep *</label>
              <select required className="input" value={form.muscle_group} onChange={e => setForm({ ...form, muscle_group: e.target.value })}>
                <option value="">Selecteer...</option>
                {muscleGroups.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                <option value="Overig">Overig</option>
              </select>
            </div>
            <div>
              <label className="label">Secundaire spieren</label>
              <input className="input" placeholder="Bijv. Biceps,Core" value={form.secondary_muscles} onChange={e => setForm({ ...form, secondary_muscles: e.target.value })} />
            </div>
            <div>
              <label className="label">Materiaal</label>
              <input className="input" placeholder="Bijv. Barbell,Bench" value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Instructies</label>
              <textarea rows={3} className="input resize-none" placeholder="Uitvoering van de oefening..." value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Opslaan...' : 'Toevoegen'}</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Annuleren</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek oefening..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Muscle group filter — 44px min height on all chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedMuscle('')}
          className={`px-4 py-2 min-h-[44px] rounded-full text-sm font-medium transition-colors ${!selectedMuscle ? 'bg-brand-700 text-white' : 'bg-white border border-surface-border text-dark-muted hover:bg-surface-hover'}`}
        >
          Alles ({exercises.length})
        </button>
        {muscleGroups.map(mg => {
          const count = exercises.filter(e => e.muscle_group === mg).length
          return (
            <button
              key={mg}
              onClick={() => setSelectedMuscle(mg === selectedMuscle ? '' : mg)}
              className={`px-4 py-2 min-h-[44px] rounded-full text-sm font-medium transition-colors ${selectedMuscle === mg ? 'bg-brand-700 text-white' : 'bg-white border border-surface-border text-dark-muted hover:bg-surface-hover'}`}
            >
              {mg} ({count})
            </button>
          )
        })}
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-dark-subtle">
          <p>Geen oefeningen gevonden</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <div key={ex.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-dark text-sm leading-snug flex-1 mr-2">{ex.name}</h3>
                {ex.is_custom === 1 && (
                  <button onClick={() => handleDelete(ex.id)} className="icon-btn text-dark-subtle hover:text-red-500 flex-shrink-0 -mt-1 -mr-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MUSCLE_COLORS[ex.muscle_group] || 'bg-surface text-dark-muted'}`}>
                  {ex.muscle_group}
                </span>
                {ex.is_custom === 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Eigen</span>
                )}
              </div>

              {ex.equipment && (
                <p className="text-xs text-dark-subtle mb-2">📦 {ex.equipment}</p>
              )}

              {ex.secondary_muscles && (
                <p className="text-xs text-dark-subtle mb-2">Secundair: {ex.secondary_muscles}</p>
              )}

              {ex.instructions && (
                <div>
                  <button
                    onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                    className="text-xs text-brand-500 hover:text-brand-700 font-medium"
                  >
                    {expandedId === ex.id ? 'Verberg instructies' : 'Toon instructies'}
                  </button>
                  {expandedId === ex.id && (
                    <p className="text-xs text-dark-muted mt-2 leading-relaxed">{ex.instructions}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
