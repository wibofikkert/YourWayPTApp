import { Router } from 'express'
import db from '../database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/clients
router.get('/', (req, res) => {
  const clients = db.prepare(`
    SELECT c.*, p.name as duo_partner_name
    FROM clients c
    LEFT JOIN clients p ON p.id = c.duo_partner_id
    WHERE c.trainer_id = ?
    ORDER BY c.name ASC
  `).all(req.trainer.id)
  res.json(clients)
})

// POST /api/clients
router.post('/', (req, res) => {
  const { name, email, birth_date, notes } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const result = db.prepare(
    'INSERT INTO clients (trainer_id, name, email, birth_date, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(req.trainer.id, name, email || null, birth_date || null, notes || null)
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(client)
})

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const client = db.prepare(`
    SELECT c.*, p.name as duo_partner_name
    FROM clients c
    LEFT JOIN clients p ON p.id = c.duo_partner_id
    WHERE c.id = ? AND c.trainer_id = ?
  `).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })
  res.json(client)
})

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })
  const { name, email, birth_date, notes } = req.body
  db.prepare(
    'UPDATE clients SET name = ?, email = ?, birth_date = ?, notes = ? WHERE id = ?'
  ).run(name, email || null, birth_date || null, notes || null, req.params.id)
  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id)
  res.json(updated)
})

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// GET /api/clients/:id/schedule — returns array of { day_of_week, start_time }
router.get('/:id/schedule', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })
  const rows = db.prepare(
    'SELECT day_of_week, start_time FROM client_schedule WHERE client_id = ? ORDER BY day_of_week'
  ).all(req.params.id)
  res.json(rows)
})

// PUT /api/clients/:id/schedule — replace schedule with array of { day_of_week, start_time }
router.put('/:id/schedule', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })
  const { days } = req.body // e.g. [{ day_of_week: 1, start_time: "09:00" }, ...]
  if (!Array.isArray(days)) return res.status(400).json({ error: 'days must be an array' })
  const valid = days.filter(d => Number.isInteger(d.day_of_week) && d.day_of_week >= 0 && d.day_of_week <= 6)
  const upsert = db.transaction(() => {
    db.prepare('DELETE FROM client_schedule WHERE client_id = ?').run(req.params.id)
    for (const entry of valid) {
      db.prepare(
        'INSERT INTO client_schedule (client_id, day_of_week, start_time) VALUES (?, ?, ?)'
      ).run(req.params.id, entry.day_of_week, entry.start_time || null)
    }
  })
  upsert()
  res.json(valid)
})

// GET /api/clients/today — clients scheduled for today (for dashboard)
router.get('/today/scheduled', (req, res) => {
  const now = new Date()
  const dow = now.getDay() // 0=Sun, 1=Mon, … 6=Sat
  const clients = db.prepare(`
    SELECT c.*, cs.start_time FROM clients c
    JOIN client_schedule cs ON cs.client_id = c.id
    WHERE c.trainer_id = ? AND cs.day_of_week = ?
    ORDER BY cs.start_time ASC, c.name ASC
  `).all(req.trainer.id, dow)
  res.json(clients)
})

// GET /api/clients/:id/duo — get duo partner info
router.get('/:id/duo', (req, res) => {
  const client = db.prepare(
    'SELECT * FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  if (!client.duo_partner_id) return res.json(null)

  const partner = db.prepare(
    'SELECT id, name FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(client.duo_partner_id, req.trainer.id)
  res.json(partner || null)
})

// PUT /api/clients/:id/duo — link duo partner (symmetric)
router.put('/:id/duo', (req, res) => {
  const client = db.prepare(
    'SELECT * FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const { partner_id } = req.body
  if (!partner_id) return res.status(400).json({ error: 'partner_id is required' })
  if (parseInt(partner_id) === parseInt(req.params.id)) return res.status(400).json({ error: 'Client cannot be duo with themselves' })

  const partner = db.prepare(
    'SELECT * FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(partner_id, req.trainer.id)
  if (!partner) return res.status(404).json({ error: 'Partner not found' })

  // Unlink any existing partners first (symmetric cleanup)
  db.transaction(() => {
    // Remove old partner links if they exist
    if (client.duo_partner_id) {
      db.prepare('UPDATE clients SET duo_partner_id = NULL WHERE id = ?').run(client.duo_partner_id)
    }
    if (partner.duo_partner_id) {
      db.prepare('UPDATE clients SET duo_partner_id = NULL WHERE id = ?').run(partner.duo_partner_id)
    }
    // Set new symmetric link
    db.prepare('UPDATE clients SET duo_partner_id = ? WHERE id = ?').run(partner_id, req.params.id)
    db.prepare('UPDATE clients SET duo_partner_id = ? WHERE id = ?').run(req.params.id, partner_id)
  })()

  res.json({ success: true, partner: { id: partner.id, name: partner.name } })
})

// DELETE /api/clients/:id/duo — unlink duo (symmetric)
router.delete('/:id/duo', (req, res) => {
  const client = db.prepare(
    'SELECT * FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  db.transaction(() => {
    if (client.duo_partner_id) {
      db.prepare('UPDATE clients SET duo_partner_id = NULL WHERE id = ?').run(client.duo_partner_id)
    }
    db.prepare('UPDATE clients SET duo_partner_id = NULL WHERE id = ?').run(req.params.id)
  })()

  res.json({ success: true })
})

// GET /api/clients/:id/sessions
router.get('/:id/sessions', (req, res) => {
  const client = db.prepare(
    'SELECT id FROM clients WHERE id = ? AND trainer_id = ?'
  ).get(req.params.id, req.trainer.id)
  if (!client) return res.status(404).json({ error: 'Client not found' })

  const sessions = db.prepare(
    'SELECT * FROM workout_sessions WHERE client_id = ? ORDER BY date DESC'
  ).all(req.params.id)

  const sessionsWithSets = sessions.map(session => {
    const sets = db.prepare(`
      SELECT ws.*, e.name as exercise_name, e.muscle_group
      FROM workout_sets ws
      JOIN exercises e ON e.id = ws.exercise_id
      WHERE ws.session_id = ?
      ORDER BY ws.exercise_id, ws.set_number
    `).all(session.id)
    return { ...session, sets }
  })

  res.json(sessionsWithSets)
})

export default router
