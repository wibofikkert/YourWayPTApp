import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MUSCLE_COLORS } from './ExerciseSearch'

function groupSetsByExercise(sets) {
  const groups = {}
  for (const s of sets) {
    if (!groups[s.exercise_id]) {
      groups[s.exercise_id] = {
        exercise_name: s.exercise_name,
        muscle_group: s.muscle_group,
        sets: [],
      }
    }
    groups[s.exercise_id].sets.push(s)
  }
  return Object.values(groups)
}

export default function WorkoutCard({ session, clientId, onDelete }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const groups = groupSetsByExercise(session.sets || [])

  const totalVolume = (session.sets || []).reduce((acc, s) => acc + s.reps * s.weight_kg, 0)

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold font-heading text-dark">{formatDate(session.date)}</p>
          <div className="flex items-center gap-4 mt-1 text-sm text-dark-muted">
            <span>{groups.length} oefening{groups.length !== 1 ? 'en' : ''}</span>
            <span>{(session.sets || []).length} sets</span>
            <span>{Math.round(totalVolume).toLocaleString('nl-NL')} kg volume</span>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 -mr-1">
          <button
            onClick={() => navigate(`/progress/${clientId}`)}
            className="icon-btn text-brand-500 hover:text-brand-700"
            title="Voortgang"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </button>
          <button
            onClick={() => navigate(`/log-workout?editSession=${session.id}`)}
            className="icon-btn text-dark-subtle hover:text-brand-500 transition-colors"
            title="Aanpassen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {onDelete && (
            <button onClick={() => onDelete(session.id)} className="icon-btn text-dark-subtle hover:text-red-600 transition-colors" title="Verwijderen">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="icon-btn text-dark-subtle hover:text-dark transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {session.notes && (
        <p className="mt-2 text-sm text-dark-muted italic">{session.notes}</p>
      )}

      {/* Exercise summary badges */}
      {!expanded && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {groups.map((g, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded font-medium font-heading ${MUSCLE_COLORS[g.muscle_group] || 'bg-surface text-dark-muted'}`}>
              {g.exercise_name}
            </span>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {groups.map((g, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold font-heading text-dark">{g.exercise_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded font-medium font-heading ${MUSCLE_COLORS[g.muscle_group] || 'bg-surface text-dark-muted'}`}>
                  {g.muscle_group}
                </span>
              </div>
              <div className="rounded overflow-hidden border border-surface-border">
                <div className="grid grid-cols-4 text-xs text-dark-subtle font-semibold font-heading bg-surface px-3 py-2 uppercase tracking-wider">
                  <span>Set</span><span>Reps</span><span>Gewicht</span><span>RPE</span>
                </div>
                {g.sets.map(s => (
                  <div key={s.id} className="grid grid-cols-4 px-3 py-2.5 text-sm text-dark border-t border-surface-border">
                    <span className="text-dark-muted">{s.set_number}</span>
                    <span className="font-medium">{s.reps}</span>
                    <span className="font-medium">{s.weight_kg} kg</span>
                    <span className="text-dark-muted">{s.rpe || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
