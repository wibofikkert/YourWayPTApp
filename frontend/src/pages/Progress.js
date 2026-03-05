import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProgressChart from '../components/ProgressChart'
import { MUSCLE_COLORS } from '../components/ExerciseSearch'

export default function Progress() {
  const { clientId, exerciseId: routeExerciseId } = useParams()
  const { api } = useAuth()
  const navigate = useNavigate()

  const [client, setClient] = useState(null)
  const [doneExercises, setDoneExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [progressData, setProgressData] = useState([])
  const [metric, setMetric] = useState('max_weight')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${clientId}`),
      api.get(`/workouts/client/${clientId}/exercises`),
    ]).then(([c, e]) => {
      setClient(c.data)
      setDoneExercises(e.data)
      // Auto-select if exerciseId in URL
      if (routeExerciseId) {
        const ex = e.data.find(ex => ex.id === parseInt(routeExerciseId))
        if (ex) setSelectedExercise(ex)
      } else if (e.data.length > 0) {
        setSelectedExercise(e.data[0])
      }
    }).catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [clientId, routeExerciseId, api, navigate])

  useEffect(() => {
    if (!selectedExercise) return
    setChartLoading(true)
    api.get(`/workouts/progress/${clientId}/${selectedExercise.id}`)
      .then(res => setProgressData(res.data))
      .finally(() => setChartLoading(false))
  }, [selectedExercise, clientId, api])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div></div>
  }

  const personalBest = progressData.length > 0
    ? Math.max(...progressData.map(d => d.max_weight))
    : null

  const totalSessions = progressData.length

  const totalVolume = progressData.reduce((acc, d) => acc + (d.total_volume || 0), 0)

  // Group exercises by muscle
  const byMuscle = doneExercises.reduce((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(`/clients/${clientId}`)} className="flex items-center gap-1 text-sm text-dark-muted hover:text-dark-light mb-6 min-h-[44px] -ml-1 pr-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Terug naar {client?.name}
      </button>

      <h1 className="text-2xl font-bold font-heading text-brand-700 mb-2">Voortgang</h1>
      <p className="text-dark-muted mb-8">{client?.name}</p>

      {doneExercises.length === 0 ? (
        <div className="text-center py-16 text-dark-subtle">
          <div className="text-4xl mb-2">📊</div>
          <p>Nog geen workouts gelogd voor {client?.name}</p>
          <button onClick={() => navigate(`/log-workout?clientId=${clientId}`)} className="btn-primary mt-4">
            Eerste workout loggen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise picker — collapsible on mobile */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="font-semibold text-dark mb-3">Oefeningen</h3>
              <div className="space-y-0.5 max-h-64 lg:max-h-96 overflow-y-auto">
                {Object.entries(byMuscle).map(([muscle, exs]) => (
                  <div key={muscle}>
                    <p className="text-xs font-semibold text-dark-subtle uppercase tracking-wider px-2 py-1 mt-2">{muscle}</p>
                    {exs.map(ex => (
                      <button
                        key={ex.id}
                        onClick={() => setSelectedExercise(ex)}
                        className={`w-full text-left px-3 py-3 min-h-[44px] rounded text-sm transition-colors flex items-center justify-between ${
                          selectedExercise?.id === ex.id
                            ? 'bg-surface-hover text-brand-700 font-medium'
                            : 'text-dark-light hover:bg-surface-hover'
                        }`}
                      >
                        <span>{ex.name}</span>
                        <span className="text-xs text-dark-subtle ml-1 flex-shrink-0">({ex.times_performed}×)</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 space-y-4">
            {selectedExercise && (
              <>
                {/* Stats — responsive grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="card text-center py-3 px-2">
                    <p className="text-base sm:text-lg font-bold text-brand-500 truncate">{personalBest ? `${personalBest} kg` : '—'}</p>
                    <p className="text-xs text-dark-muted mt-0.5">Personal Best</p>
                  </div>
                  <div className="card text-center py-3 px-2">
                    <p className="text-base sm:text-lg font-bold text-brand-500">{totalSessions}</p>
                    <p className="text-xs text-dark-muted mt-0.5">Sessies</p>
                  </div>
                  <div className="card text-center py-3 px-2">
                    <p className="text-base sm:text-lg font-bold text-brand-500 truncate">{Math.round(totalVolume).toLocaleString('nl-NL')} kg</p>
                    <p className="text-xs text-dark-muted mt-0.5">Volume</p>
                  </div>
                </div>

                {/* Chart card */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-dark">{selectedExercise.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MUSCLE_COLORS[selectedExercise.muscle_group] || 'bg-surface text-dark-muted'}`}>
                        {selectedExercise.muscle_group}
                      </span>
                    </div>
                    <select
                      className="input text-sm w-full sm:w-auto max-w-[160px]"
                      value={metric}
                      onChange={e => setMetric(e.target.value)}
                    >
                      <option value="max_weight">Max gewicht</option>
                      <option value="max_reps">Max reps</option>
                      <option value="total_volume">Totaal volume</option>
                    </select>
                  </div>

                  {chartLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-700"></div>
                    </div>
                  ) : (
                    <ProgressChart
                      data={progressData}
                      exerciseName={selectedExercise.name}
                      metric={metric}
                    />
                  )}
                </div>

                {/* History table — horizontal scroll on mobile */}
                {progressData.length > 0 && (
                  <div className="card p-0 overflow-hidden">
                    <h4 className="font-semibold text-dark px-4 sm:px-6 py-4 border-b border-surface-border">Geschiedenis</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ minWidth: '320px' }}>
                        <thead>
                          <tr className="text-left text-dark-subtle text-xs font-semibold font-heading uppercase tracking-wider bg-surface border-b border-surface-border">
                            <th className="px-4 sm:px-6 py-3">Datum</th>
                            <th className="px-3 py-3">Max kg</th>
                            <th className="px-3 py-3">Max reps</th>
                            <th className="px-3 py-3">Sets</th>
                            <th className="px-3 py-3">Volume</th>
                            <th className="px-3 py-3 pr-4 sm:pr-6">RPE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {[...progressData].reverse().map((d, i) => (
                            <tr key={i} className="text-dark-light hover:bg-surface transition-colors">
                              <td className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">{new Date(d.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                              <td className="px-3 py-3 font-semibold text-brand-700">{d.max_weight} kg</td>
                              <td className="px-3 py-3">{d.max_reps}</td>
                              <td className="px-3 py-3">{d.total_sets}</td>
                              <td className="px-3 py-3">{Math.round(d.total_volume)} kg</td>
                              <td className="px-3 py-3 pr-4 sm:pr-6">{d.avg_rpe || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
