import React, { useState, useMemo, useEffect, useRef } from 'react'

const MUSCLE_COLORS = {
  Chest: 'bg-red-100 text-red-700',
  Back: 'bg-blue-100 text-blue-700',
  Legs: 'bg-green-100 text-green-700',
  Shoulders: 'bg-yellow-100 text-yellow-700',
  Biceps: 'bg-purple-100 text-purple-700',
  Triceps: 'bg-indigo-100 text-indigo-700',
  Core: 'bg-orange-100 text-orange-700',
  Glutes: 'bg-pink-100 text-pink-700',
  'Full Body': 'bg-cyan-100 text-cyan-700',
}

export { MUSCLE_COLORS }

export default function ExerciseSearch({ exercises, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const muscleGroups = useMemo(() => {
    return [...new Set(exercises.map(e => e.muscle_group))].sort()
  }, [exercises])

  const filtered = useMemo(() => {
    return exercises.filter(e => {
      const matchesQuery = !query || e.name.toLowerCase().includes(query.toLowerCase())
      const matchesMuscle = !selectedMuscle || e.muscle_group === selectedMuscle
      return matchesQuery && matchesMuscle
    })
  }, [exercises, query, selectedMuscle])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h3 className="font-semibold font-heading text-brand-700 uppercase tracking-wider text-sm">Oefening kiezen</h3>
          <button onClick={onClose} className="text-dark-subtle hover:text-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-surface-border">
          <input
            ref={inputRef}
            type="text"
            placeholder="Zoek oefening..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMuscle('')}
              className={`px-3 py-1 rounded text-xs font-semibold font-heading tracking-wider uppercase transition-colors ${!selectedMuscle ? 'bg-brand-700 text-white' : 'bg-surface text-dark-muted hover:bg-surface-hover'}`}
            >
              Alles
            </button>
            {muscleGroups.map(mg => (
              <button
                key={mg}
                onClick={() => setSelectedMuscle(mg === selectedMuscle ? '' : mg)}
                className={`px-3 py-1 rounded text-xs font-semibold font-heading tracking-wider uppercase transition-colors ${selectedMuscle === mg ? 'bg-brand-700 text-white' : 'bg-surface text-dark-muted hover:bg-surface-hover'}`}
              >
                {mg}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-dark-subtle py-8">Geen oefeningen gevonden</p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {filtered.map(ex => (
                <li key={ex.id}>
                  <button
                    onClick={() => { onSelect(ex); onClose() }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium font-heading text-dark">{ex.name}</p>
                      {ex.equipment && <p className="text-xs text-dark-subtle">{ex.equipment}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${MUSCLE_COLORS[ex.muscle_group] || 'bg-gray-100 text-gray-600'}`}>
                      {ex.muscle_group}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
