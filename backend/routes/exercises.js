import { Router } from 'express'
import db from '../database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/exercises
router.get('/', (req, res) => {
  const { muscle_group, search } = req.query
  let query = `
    SELECT * FROM exercises
    WHERE (is_custom = 0 OR (is_custom = 1 AND trainer_id = ?))
  `
  const params = [req.trainer.id]

  if (muscle_group) {
    query += ' AND muscle_group = ?'
    params.push(muscle_group)
  }
  if (search) {
    query += ' AND name LIKE ?'
    params.push(`%${search}%`)
  }
  query += ' ORDER BY muscle_group, name'

  const exercises = db.prepare(query).all(...params)
  res.json(exercises)
})

// GET /api/exercises/muscle-groups
router.get('/muscle-groups', (req, res) => {
  const groups = db.prepare(
    `SELECT DISTINCT muscle_group FROM exercises
     WHERE is_custom = 0 OR (is_custom = 1 AND trainer_id = ?)
     ORDER BY muscle_group`
  ).all(req.trainer.id)
  res.json(groups.map(g => g.muscle_group))
})

// GET /api/exercises/:id
router.get('/:id', (req, res) => {
  const exercise = db.prepare(
    `SELECT * FROM exercises WHERE id = ? AND (is_custom = 0 OR trainer_id = ?)`
  ).get(req.params.id, req.trainer.id)
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' })
  res.json(exercise)
})

// POST /api/exercises (custom exercise)
router.post('/', (req, res) => {
  const { name, muscle_group, secondary_muscles, equipment, instructions } = req.body
  if (!name || !muscle_group) {
    return res.status(400).json({ error: 'Name and muscle_group are required' })
  }
  const result = db.prepare(
    `INSERT INTO exercises (name, muscle_group, secondary_muscles, equipment, instructions, is_custom, trainer_id)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  ).run(name, muscle_group, secondary_muscles || null, equipment || null, instructions || null, req.trainer.id)
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(exercise)
})

// DELETE /api/exercises/:id (only custom exercises by this trainer)
router.delete('/:id', (req, res) => {
  const exercise = db.prepare(
    'SELECT id FROM exercises WHERE id = ? AND is_custom = 1 AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!exercise) return res.status(404).json({ error: 'Exercise not found or not deletable' })
  db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

export default router
