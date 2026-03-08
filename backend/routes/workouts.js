import { Router } from 'express'
import db from '../database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// POST /api/workouts/sessions
router.post('/sessions', (req, res) => {
  const { client_id, date, notes } = req.body
  if (!client_id || !date) {
    return res.status(400).json({ error: 'client_id and date are required' })
  }
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ?'
  ).get(client_id)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const result = db.prepare(
    'INSERT INTO workout_sessions (client_id, trainer_id, date, notes) VALUES (?, ?, ?, ?)'
  ).run(client_id, req.trainer.id, date, notes || null)
  const session = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(session)
})

// GET /api/workouts/sessions/:id
router.get('/sessions/:id', (req, res) => {
  const session = db.prepare(
    'SELECT * FROM workout_sessions WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const sets = db.prepare(`
    SELECT ws.*, e.name as exercise_name, e.muscle_group
    FROM workout_sets ws
    JOIN exercises e ON e.id = ws.exercise_id
    WHERE ws.session_id = ?
    ORDER BY ws.exercise_id, ws.set_number
  `).all(session.id)

  res.json({ ...session, sets })
})

// PUT /api/workouts/sessions/:id
router.put('/sessions/:id', (req, res) => {
  const session = db.prepare(
    'SELECT id FROM workout_sessions WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const { date, notes } = req.body
  db.prepare('UPDATE workout_sessions SET date = ?, notes = ? WHERE id = ?')
    .run(date, notes || null, req.params.id)
  const updated = db.prepare('SELECT * FROM workout_sessions WHERE id = ?').get(req.params.id)
  res.json(updated)
})

// DELETE /api/workouts/sessions/:id
router.delete('/sessions/:id', (req, res) => {
  const session = db.prepare(
    'SELECT id FROM workout_sessions WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  db.prepare('DELETE FROM workout_sessions WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// POST /api/workouts/sessions/:id/sets
router.post('/sessions/:id/sets', (req, res) => {
  const session = db.prepare(
    'SELECT id FROM workout_sessions WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const sets = Array.isArray(req.body) ? req.body : [req.body]
  if (!sets.length) return res.status(400).json({ error: 'No sets provided' })

  const insert = db.prepare(
    'INSERT INTO workout_sets (session_id, exercise_id, set_number, reps, weight_kg, rpe) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertMany = db.transaction((sets) => {
    for (const s of sets) {
      insert.run(req.params.id, s.exercise_id, s.set_number, s.reps, s.weight_kg, s.rpe || null)
    }
  })
  insertMany(sets)

  const allSets = db.prepare('SELECT * FROM workout_sets WHERE session_id = ?').all(req.params.id)
  res.status(201).json(allSets)
})

// DELETE /api/workouts/sessions/:id/sets — remove all sets for a session (used when replacing sets on edit)
router.delete('/sessions/:id/sets', (req, res) => {
  const session = db.prepare(
    'SELECT id FROM workout_sessions WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  db.prepare('DELETE FROM workout_sets WHERE session_id = ?').run(req.params.id)
  res.json({ success: true })
})

// PUT /api/workouts/sets/:id
router.put('/sets/:id', (req, res) => {
  const set = db.prepare(`
    SELECT ws.id FROM workout_sets ws
    JOIN workout_sessions s ON s.id = ws.session_id
    WHERE ws.id = ? AND s.trainer_id = ?
  `).get(req.params.id, req.trainer.id)
  if (!set) return res.status(404).json({ error: 'Set not found' })

  const { reps, weight_kg, rpe } = req.body
  db.prepare('UPDATE workout_sets SET reps = ?, weight_kg = ?, rpe = ? WHERE id = ?')
    .run(reps, weight_kg, rpe || null, req.params.id)
  const updated = db.prepare('SELECT * FROM workout_sets WHERE id = ?').get(req.params.id)
  res.json(updated)
})

// DELETE /api/workouts/sets/:id
router.delete('/sets/:id', (req, res) => {
  const set = db.prepare(`
    SELECT ws.id FROM workout_sets ws
    JOIN workout_sessions s ON s.id = ws.session_id
    WHERE ws.id = ? AND s.trainer_id = ?
  `).get(req.params.id, req.trainer.id)
  if (!set) return res.status(404).json({ error: 'Set not found' })
  db.prepare('DELETE FROM workout_sets WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// GET /api/workouts/progress/:clientId/:exerciseId
router.get('/progress/:clientId/:exerciseId', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ?'
  ).get(req.params.clientId)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const data = db.prepare(`
    SELECT
      ws.date,
      MAX(wset.weight_kg)                   AS max_weight,
      MAX(wset.reps)                         AS max_reps,
      ROUND(AVG(wset.rpe), 1)               AS avg_rpe,
      SUM(wset.reps * wset.weight_kg)        AS total_volume,
      COUNT(DISTINCT wset.id)                AS total_sets
    FROM workout_sessions ws
    JOIN workout_sets wset ON wset.session_id = ws.id
    WHERE ws.client_id    = ?
      AND wset.exercise_id = ?
    GROUP BY ws.date
    ORDER BY ws.date ASC
  `).all(req.params.clientId, req.params.exerciseId)

  res.json(data)
})

// GET /api/workouts/client/:clientId/exercises  — exercises a client has done
router.get('/client/:clientId/exercises', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ?'
  ).get(req.params.clientId)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const exercises = db.prepare(`
    SELECT DISTINCT e.id, e.name, e.muscle_group, COUNT(wset.id) as times_performed
    FROM workout_sets wset
    JOIN exercises e ON e.id = wset.exercise_id
    JOIN workout_sessions ws ON ws.id = wset.session_id
    WHERE ws.client_id = ?
    GROUP BY e.id
    ORDER BY e.muscle_group, e.name
  `).all(req.params.clientId)

  res.json(exercises)
})

// GET /api/workouts/last-session/:clientId/:exerciseId
// Returns sets from the most recent session where client did this exercise
router.get('/last-session/:clientId/:exerciseId', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ?'
  ).get(req.params.clientId)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  // Get the most recent session id + date that includes this exercise
  const lastSession = db.prepare(`
    SELECT ws.id, ws.date
    FROM workout_sessions ws
    JOIN workout_sets wset ON wset.session_id = ws.id
    WHERE ws.client_id = ? AND wset.exercise_id = ?
    ORDER BY ws.date DESC, ws.id DESC
    LIMIT 1
  `).get(req.params.clientId, req.params.exerciseId)

  if (!lastSession) return res.json({ date: null, sets: [] })

  // Return all sets from that session for this exercise
  const sets = db.prepare(`
    SELECT set_number, reps, weight_kg, rpe
    FROM workout_sets
    WHERE session_id = ? AND exercise_id = ?
    ORDER BY set_number ASC
  `).all(lastSession.id, req.params.exerciseId)

  res.json({ date: lastSession.date, sets })
})

export default router
